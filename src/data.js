export const portfolio = {
  name: 'Febriawan Ramadhan',
  role: 'Assistant Manager, Project Management and Construction',
  organization: 'PLN West Java Distribution Unit',
  bio: "I manage projects, construction, and investment budgets at PLN's West Java Distribution Unit. I previously led distribution operations, logistics, and technical teams. I hold a Diploma III (D3) in Electrical Engineering and a bachelor's degree (S1) in Industrial Engineering.",
  projects: [
    {
      title: 'Sieneng',
      type: 'Inventory management',
      description: 'An inventory management application for PLN West Java Distribution Unit.',
      url: 'https://sieneng.app'
    },
    {
      title: 'Posko Yantek Optimizer',
      type: 'Geospatial analysis',
      description: 'Analyzes individual outage data to identify optimal locations for technical service posts.',
      url: 'https://posko-yantek.frdev.id/'
    }
  ],
  experience: [
    {
      date: 'CURRENT',
      role: 'Assistant Manager, Project Management and Construction',
      place: 'PLN West Java Distribution Unit',
      detail: 'Manage projects, construction, and investment budgets.'
    },
    {
      date: 'PREVIOUS',
      role: 'Distribution Operations Team Leader',
      place: 'PLN UP3 Cirebon',
      detail: 'Managed distribution system operating patterns.'
    },
    {
      date: 'PREVIOUS',
      role: 'Logistics Team Leader',
      place: 'PLN UP3 Cirebon',
      detail: 'Managed the warehouse and logistics.'
    },
    {
      date: 'START',
      role: 'Technical Team Leader',
      place: 'PLN ULP',
      detail: 'Managed technical work at the ULP office.'
    }
  ],
  email: 'febriawan1502@gmail.com',
  workEmail: 'febriawan.ramadhan@pln.co.id',
  github: 'https://github.com/febriawan1502'
};

export const stations = [
  { id: 'about', title: 'Wind Turbine', number: '01', type: 'wind', x: -8, z: -4.5 },
  { id: 'projects', title: 'Solar Panels', number: '02', type: 'solar', x: 7.5, z: -5.5 },
  { id: 'experience', title: 'Hydro Power', number: '03', type: 'hydro', x: -8.5, z: 6.5 },
  { id: 'contact', title: 'Geothermal', number: '04', type: 'geothermal', x: 8, z: 6.5 }
];
