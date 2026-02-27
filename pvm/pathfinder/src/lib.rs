#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod pathfinder {
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    /// Represents an edge between two parachains
    #[derive(scale::Decode, scale::Encode, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Channel {
        pub from_chain: u32,
        pub to_chain: u32,
        pub cost_estimate: u128,  // fee in Planck
        pub active: bool,
    }

    #[ink(storage)]
    pub struct Pathfinder {
        // chain_id => list of destination chain IDs it can reach
        adjacency: Mapping<u32, Vec<u32>>,
        // (from, to) encoded as u64 => cost
        edge_costs: Mapping<u64, u128>,
        admin: ink::primitives::H160,
    }

    impl Pathfinder {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                adjacency: Default::default(),
                edge_costs: Default::default(),
                admin: Self::env().caller(),
            }
        }

        /// Admin registers a route between two parachains
        #[ink(message)]
        pub fn add_route(&mut self, from: u32, to: u32, cost: u128) {
            assert_eq!(self.env().caller(), self.admin, "Only admin");
            let key = Self::edge_key(from, to);
            self.edge_costs.insert(key, &cost);
            let mut neighbors = self.adjacency.get(from).unwrap_or_default();
            if !neighbors.contains(&to) {
                neighbors.push(to);
                self.adjacency.insert(from, &neighbors);
            }
        }

        /// Dijkstra shortest path — returns ordered list of chain IDs
        #[ink(message)]
        pub fn find_route(&self, from: u32, to: u32) -> Vec<u32> {
            if from == to { return ink::prelude::vec![from]; }

            // Simplified greedy BFS for MVP (replace with full Dijkstra post-hackathon)
            let mut path = ink::prelude::vec![from];
            let mut current = from;

            for _ in 0..10 {   // max 10 hops
                if current == to { break; }
                let neighbors = self.adjacency.get(current).unwrap_or_default();
                if neighbors.is_empty() { break; }

                // Pick cheapest neighbor toward destination
                let next = neighbors.iter()
                    .min_by_key(|&&n| self.edge_costs.get(Self::edge_key(current, n)).unwrap_or(u128::MAX))
                    .copied();

                if let Some(n) = next {
                    path.push(n);
                    current = n;
                } else {
                    break;
                }
            }
            path
        }

        #[ink(message)]
        pub fn get_edge_cost(&self, from: u32, to: u32) -> u128 {
            self.edge_costs.get(Self::edge_key(from, to)).unwrap_or(0)
        }

        fn edge_key(from: u32, to: u32) -> u64 {
            ((from as u64) << 32) | (to as u64)
        }
    }
}
