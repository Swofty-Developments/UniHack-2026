export type TeamMember = {
  name: string;
  roles: string[];
  discordId: string;
  bio?: string;
};

export const TEAM: TeamMember[] = [
  {
    name: "Tansimran Sandhu",
    roles: ["Backend", "Frontend", "Media"],
    discordId: "782492200587362315",
  },
  {
    name: "Ian Ko",
    roles: ["Frontend", "Media", "Research"],
    discordId: "470983490494529546",
  },
  {
    name: "Jason Yi",
    roles: ["Backend", "Frontend"],
    discordId: "373379352764612617",
  },
  {
    name: "Cherry Dangerfield",
    roles: ["Media", "Research"],
    discordId: "414304321354727424",
  },
  {
    name: "Jacob Nardella",
    roles: ["Backend", "Frontend"],
    discordId: "873815509097918504",
  },
];

