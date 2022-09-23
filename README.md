# Deviants NFT Drop

## Overview

**Polymorphs are on an expedition to explore new lands, and they have their eyes set on exploring the paradise island of Metaversia. The Polymorphic Extreme Edition of Planetary Exploration Enterprise, or P.E.E.P.E.E. for short, put together a team of expert and specialist Polymorphs to unearth what the island offers. When they land, they are greeted by overly friendly Metaversian humans who seem suspicious, but the Polymorphs could not find any evidence to confirm their reservations. Clown Charles, the team’s self-centered, off-the-cuff, and unfiltered leader, acts on his doubts and ends up causing a nuclear accident that blasted through the entire island. The Polymorphs came out of their bunker to find all the Metaversian humans had been wiped out, and their Polymorph colleagues changed forever in strange ways.**

## Setup
- `npm install`
### Contracts deployment
- `npx hardhat run scripts/deploy.js --network <network_name>`

### Etherscan verification

- `npx hardhat verify <contract_address> --network <network_name> --constructor-args scripts/deviants-args.js`
