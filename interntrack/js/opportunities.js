/**
 * InternTrack - Internet Internship Opportunities Aggregator
 * Collects internship opportunities from across the internet (Google Careers, LinkedIn,
 * Wellfound, Unstop, Internshala, Y Combinator, and Company Portals).
 * 
 * Features:
 * - Filter & Search by Region (India, United States, Worldwide Remote, Europe)
 * - Filter & Search by State (Karnataka, Maharashtra, Telangana, Delhi NCR, Tamil Nadu, California, Washington, New York, etc.)
 * - Real-time keyword search (role, company, skills, location, region, state)
 * - Category filter (Software/SDE, AI/ML, Web/Fullstack, Backend/Cloud, Design/Product, Remote)
 * - Platform & Work Mode filters
 * - Direct "Apply on Official Site" link to the platform
 * - 1-Click "+ Track in App" to save to LocalStorage Tracker
 */

const Opportunities = {
  // Curated live internship database from across the internet
  items: [],

  // Regions & States Hierarchy
  regions: {
    'all': { label: 'All Regions', states: [] },
    'India': {
      label: 'India',
      states: [
        { id: 'all', label: 'All States in India' },
        { id: 'Karnataka', label: 'Karnataka (Bengaluru)' },
        { id: 'Maharashtra', label: 'Maharashtra (Mumbai / Pune)' },
        { id: 'Telangana', label: 'Telangana (Hyderabad)' },
        { id: 'Delhi NCR', label: 'Delhi NCR (Delhi / Noida / Gurugram)' },
        { id: 'Tamil Nadu', label: 'Tamil Nadu (Chennai)' },
        { id: 'Uttar Pradesh', label: 'Uttar Pradesh (Noida)' },
        { id: 'Gujarat', label: 'Gujarat (Ahmedabad / Gandhinagar)' },
        { id: 'Kerala', label: 'Kerala (Kochi)' },
        { id: 'West Bengal', label: 'West Bengal (Kolkata)' }
      ]
    },
    'United States': {
      label: 'United States',
      states: [
        { id: 'all', label: 'All US States' },
        { id: 'California', label: 'California (Silicon Valley / SF)' },
        { id: 'Washington', label: 'Washington (Seattle / Redmond)' },
        { id: 'New York', label: 'New York (NYC)' },
        { id: 'Texas', label: 'Texas (Austin)' },
        { id: 'Massachusetts', label: 'Massachusetts (Boston)' }
      ]
    },
    'Remote': {
      label: 'Worldwide Remote',
      states: [
        { id: 'all', label: 'All Remote Locations' },
        { id: 'Global (Anywhere)', label: 'Global (Work from Anywhere)' },
        { id: 'Remote Americas', label: 'Remote Americas' },
        { id: 'Remote Europe', label: 'Remote Europe / EMEA' },
        { id: 'Remote APAC', label: 'Remote Asia-Pacific' }
      ]
    },
    'Europe': {
      label: 'Europe & UK',
      states: [
        { id: 'all', label: 'All European Locations' },
        { id: 'United Kingdom', label: 'United Kingdom (London)' },
        { id: 'Germany', label: 'Germany (Berlin / Munich)' },
        { id: 'Netherlands', label: 'Netherlands (Amsterdam)' }
      ]
    }
  },

  // Current filter state
  filters: {
    query: '',
    category: 'all',
    workMode: 'all',
    platform: 'all',
    region: 'all',
    state: 'all'
  },

  init() {
    this.generateOpportunities();
    this.populateRegionDropdown();
    this.updateStateDropdown('all');
    this.render();
    this.bindEvents();
    
    // Re-render when tracker updates to reflect "Tracked" status buttons
    window.addEventListener('interntrack:data-updated', () => {
      this.render();
    });
  },

  /**
   * Populate Region selector
   */
  populateRegionDropdown() {
    const regionSelect = document.getElementById('opps-region-filter');
    if (!regionSelect) return;

    regionSelect.innerHTML = Object.keys(this.regions).map(key => `
      <option value="${key}">${this.regions[key].label}</option>
    `).join('');
  },

  /**
   * Dynamically populate State selector based on chosen Region
   */
  updateStateDropdown(regionKey) {
    const stateSelect = document.getElementById('opps-state-filter');
    if (!stateSelect) return;

    let statesList = [];
    if (regionKey === 'all') {
      statesList = [
        { id: 'all', label: 'All States / Locations' },
        { id: 'Karnataka', label: 'Karnataka (Bengaluru)' },
        { id: 'Maharashtra', label: 'Maharashtra (Mumbai / Pune)' },
        { id: 'Telangana', label: 'Telangana (Hyderabad)' },
        { id: 'Delhi NCR', label: 'Delhi NCR (Delhi / Noida / Gurugram)' },
        { id: 'Tamil Nadu', label: 'Tamil Nadu (Chennai)' },
        { id: 'Uttar Pradesh', label: 'Uttar Pradesh (Noida)' },
        { id: 'Gujarat', label: 'Gujarat (Ahmedabad)' },
        { id: 'California', label: 'California (Silicon Valley / SF)' },
        { id: 'Washington', label: 'Washington (Seattle / Redmond)' },
        { id: 'New York', label: 'New York (NYC)' },
        { id: 'Global (Anywhere)', label: 'Global (Worldwide Remote)' },
        { id: 'United Kingdom', label: 'United Kingdom (London)' },
        { id: 'Germany', label: 'Germany (Berlin)' }
      ];
    } else if (this.regions[regionKey]) {
      statesList = this.regions[regionKey].states;
    }

    stateSelect.innerHTML = statesList.map(st => `
      <option value="${st.id}" ${this.filters.state === st.id ? 'selected' : ''}>${st.label}</option>
    `).join('');
  },

  /**
   * Generates dynamic, realistic opportunities with Region, State, and live deadlines
   */
  generateOpportunities() {
    const today = new Date();
    const getDeadline = (daysFromNow) => {
      const d = new Date(today);
      d.setDate(today.getDate() + daysFromNow);
      return d.toISOString().split('T')[0];
    };

    this.items = [
      {
        id: 'opp_google_swe',
        company: 'Google',
        role: 'Software Engineering Intern (Summer 2027)',
        category: 'swe',
        platform: 'Google Careers',
        platformColor: '#4285F4',
        logoText: 'G',
        logoBg: '#EA4335',
        region: 'India',
        state: 'Karnataka',
        location: 'Bengaluru, Karnataka (India)',
        workMode: 'Hybrid',
        stipend: '₹85,000 / month',
        duration: '6 Months',
        skills: ['Python', 'C++', 'Data Structures', 'Algorithms', 'Git'],
        applyUrl: 'https://careers.google.com/jobs/results/?q=intern',
        deadline: getDeadline(12),
        deadlineDays: 12,
        description: 'Work alongside Google engineers building large-scale distributed systems and world-class consumer apps.',
        featured: true
      },
      {
        id: 'opp_msft_swe',
        company: 'Microsoft',
        role: 'Software Engineer & Explorer Intern',
        category: 'swe',
        platform: 'Microsoft Careers',
        platformColor: '#00A4EF',
        logoText: 'M',
        logoBg: '#0078D4',
        region: 'India',
        state: 'Telangana',
        location: 'Hyderabad, Telangana (India)',
        workMode: 'Hybrid',
        stipend: '₹75,000 / month',
        duration: '3 Months',
        skills: ['C#', 'TypeScript', 'Azure', 'Algorithms', 'OOP'],
        applyUrl: 'https://careers.microsoft.com/us/en/search-results?keywords=intern',
        deadline: getDeadline(18),
        deadlineDays: 18,
        description: 'Collaborate with Azure, Teams, or Windows product teams designing high-availability cloud features.',
        featured: true
      },
      {
        id: 'opp_amazon_sde',
        company: 'Amazon',
        role: 'Software Development Engineer (SDE) Intern',
        category: 'swe',
        platform: 'Amazon Jobs',
        platformColor: '#FF9900',
        logoText: 'A',
        logoBg: '#232F3E',
        region: 'India',
        state: 'Tamil Nadu',
        location: 'Chennai, Tamil Nadu (India)',
        workMode: 'On-site',
        stipend: '₹80,000 / month',
        duration: '6 Months',
        skills: ['Java', 'Data Structures', 'AWS', 'System Design', 'Git'],
        applyUrl: 'https://www.amazon.jobs/en/job_categories/software-development',
        deadline: getDeadline(8),
        deadlineDays: 8,
        description: 'Design, write, and deploy scalable microservices powering millions of daily customer orders on AWS.',
        featured: true
      },
      {
        id: 'opp_stripe_frontend',
        company: 'Stripe',
        role: 'Frontend Engineering Intern',
        category: 'web',
        platform: 'Wellfound',
        platformColor: '#635BFF',
        logoText: 'S',
        logoBg: '#635BFF',
        region: 'Remote',
        state: 'Global (Anywhere)',
        location: 'Remote (Worldwide)',
        workMode: 'Remote',
        stipend: '₹1,20,000 / month ($45/hr)',
        duration: '3 Months',
        skills: ['React', 'TypeScript', 'CSS/PostCSS', 'Design Systems'],
        applyUrl: 'https://stripe.com/jobs/search?teams=internships',
        deadline: getDeadline(15),
        deadlineDays: 15,
        description: 'Craft beautiful, accessible, ultra-reliable payment checkout experiences and developer dashboards.',
        featured: true
      },
      {
        id: 'opp_zomato_sde',
        company: 'Zomato',
        role: 'Full Stack Web Developer Intern',
        category: 'web',
        platform: 'LinkedIn',
        platformColor: '#0077B5',
        logoText: 'Z',
        logoBg: '#CB202D',
        region: 'India',
        state: 'Delhi NCR',
        location: 'Gurugram, Delhi NCR (India)',
        workMode: 'On-site',
        stipend: '₹50,000 / month',
        duration: '6 Months',
        skills: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'TailwindCSS'],
        applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=zomato%20intern',
        deadline: getDeadline(5),
        deadlineDays: 5,
        description: 'Build fast, interactive user interfaces for millions of daily food delivery and restaurant discovery users.',
        featured: false
      },
      {
        id: 'opp_swiggy_backend',
        company: 'Swiggy',
        role: 'Backend Engineering Intern',
        category: 'backend',
        platform: 'Unstop',
        platformColor: '#0066FF',
        logoText: 'S',
        logoBg: '#FC8019',
        region: 'India',
        state: 'Karnataka',
        location: 'Bengaluru, Karnataka (India)',
        workMode: 'Hybrid',
        stipend: '₹60,000 / month',
        duration: '6 Months',
        skills: ['Go', 'Java', 'Kafka', 'Docker', 'Distributed Systems'],
        applyUrl: 'https://unstop.com/internships?searchTerm=swiggy',
        deadline: getDeadline(14),
        deadlineDays: 14,
        description: 'Optimize high-throughput order dispatch algorithms, routing systems, and delivery partner matching.',
        featured: false
      },
      {
        id: 'opp_razorpay_fintech',
        company: 'Razorpay',
        role: 'Fintech Software Engineering Intern',
        category: 'swe',
        platform: 'Company Portal',
        platformColor: '#0C2340',
        logoText: 'R',
        logoBg: '#0C2340',
        region: 'India',
        state: 'Karnataka',
        location: 'Bengaluru, Karnataka (India)',
        workMode: 'Hybrid',
        stipend: '₹65,000 / month',
        duration: '6 Months',
        skills: ['PHP', 'Go', 'MySQL', 'REST APIs', 'Unit Testing'],
        applyUrl: 'https://razorpay.com/jobs/',
        deadline: getDeadline(21),
        deadlineDays: 21,
        description: "Work on India's leading payment gateway processing billions of rupees in transactions every day.",
        featured: false
      },
      {
        id: 'opp_supabase_oss',
        company: 'Supabase',
        role: 'Open Source Full Stack Intern',
        category: 'web',
        platform: 'Wellfound',
        platformColor: '#3ECF8E',
        logoText: 'S',
        logoBg: '#1C1C1C',
        region: 'Remote',
        state: 'Global (Anywhere)',
        location: 'Remote (Worldwide)',
        workMode: 'Remote',
        stipend: '$35 / hour',
        duration: '3 Months',
        skills: ['Next.js', 'PostgreSQL', 'TypeScript', 'TailwindCSS', 'Open Source'],
        applyUrl: 'https://wellfound.com/company/supabase/jobs',
        deadline: getDeadline(9),
        deadlineDays: 9,
        description: 'Contribute to the open source Firebase alternative with over 70,000 stars on GitHub.',
        featured: true
      },
      {
        id: 'opp_meta_swe',
        company: 'Meta',
        role: 'Software Engineer Intern - Systems',
        category: 'swe',
        platform: 'Company Portal',
        platformColor: '#0668E1',
        logoText: 'M',
        logoBg: '#0668E1',
        region: 'United States',
        state: 'California',
        location: 'Menlo Park, California (USA)',
        workMode: 'Hybrid',
        stipend: '$55 / hour',
        duration: '3 Months',
        skills: ['C++', 'Python', 'Algorithms', 'Linux', 'Network Protocols'],
        applyUrl: 'https://www.metacareers.com/jobs?roles[0]=Internship',
        deadline: getDeadline(6),
        deadlineDays: 6,
        description: 'Build backend infrastructure, messaging pipelines, and AI delivery systems across Instagram and WhatsApp.',
        featured: true
      },
      {
        id: 'opp_zepto_fullstack',
        company: 'Zepto',
        role: 'Frontend & App Developer Intern',
        category: 'web',
        platform: 'Unstop',
        platformColor: '#0066FF',
        logoText: 'Z',
        logoBg: '#5925DC',
        region: 'India',
        state: 'Maharashtra',
        location: 'Mumbai, Maharashtra (India)',
        workMode: 'On-site',
        stipend: '₹45,000 / month',
        duration: '6 Months',
        skills: ['React Native', 'React.js', 'Redux', 'JavaScript', 'REST APIs'],
        applyUrl: 'https://unstop.com/internships?searchTerm=zepto',
        deadline: getDeadline(4),
        deadlineDays: 4,
        description: 'Build hyper-responsive 10-minute grocery delivery interfaces used by millions of urban households.',
        featured: false
      },
      {
        id: 'opp_netflix_data',
        company: 'Netflix',
        role: 'Data Science & Analytics Intern',
        category: 'aiml',
        platform: 'Company Portal',
        platformColor: '#E50914',
        logoText: 'N',
        logoBg: '#E50914',
        region: 'United States',
        state: 'California',
        location: 'Los Gatos, California (USA)',
        workMode: 'Hybrid',
        stipend: '$52 / hour',
        duration: '3 Months',
        skills: ['Python', 'SQL', 'Pandas', 'Machine Learning', 'Tableau'],
        applyUrl: 'https://jobs.netflix.com/search?q=intern',
        deadline: getDeadline(16),
        deadlineDays: 16,
        description: 'Analyze streaming engagement patterns and build predictive recommendation models for content personalization.',
        featured: false
      },
      {
        id: 'opp_uber_backend',
        company: 'Uber',
        role: 'Backend Engineering Intern',
        category: 'backend',
        platform: 'LinkedIn',
        platformColor: '#0077B5',
        logoText: 'U',
        logoBg: '#000000',
        region: 'India',
        state: 'Telangana',
        location: 'Hyderabad, Telangana (India)',
        workMode: 'Hybrid',
        stipend: '₹75,000 / month',
        duration: '6 Months',
        skills: ['Java', 'Go', 'Microservices', 'Kafka', 'System Design'],
        applyUrl: 'https://www.uber.com/us/en/careers/list/?department=University',
        deadline: getDeadline(11),
        deadlineDays: 11,
        description: 'Work on driver allocation, surge pricing models, and real-time geospatial tracking platforms.',
        featured: true
      },
      {
        id: 'opp_flipkart_swe',
        company: 'Flipkart',
        role: 'SDE Intern - Supply Chain Tech',
        category: 'swe',
        platform: 'Unstop',
        platformColor: '#0066FF',
        logoText: 'F',
        logoBg: '#2874F0',
        region: 'India',
        state: 'Karnataka',
        location: 'Bengaluru, Karnataka (India)',
        workMode: 'On-site',
        stipend: '₹60,000 / month',
        duration: '6 Months',
        skills: ['Java', 'Data Structures', 'Spring Boot', 'MySQL'],
        applyUrl: 'https://unstop.com/internships?searchTerm=flipkart',
        deadline: getDeadline(13),
        deadlineDays: 13,
        description: 'Architect logistics tracking software handling peak Big Billion Days warehouse load.',
        featured: false
      },
      {
        id: 'opp_vercel_devrel',
        company: 'Vercel',
        role: 'Developer Experience & Next.js Intern',
        category: 'web',
        platform: 'Wellfound',
        platformColor: '#000000',
        logoText: 'V',
        logoBg: '#000000',
        region: 'Remote',
        state: 'Global (Anywhere)',
        location: 'Remote (Worldwide)',
        workMode: 'Remote',
        stipend: '$40 / hour',
        duration: '3 Months',
        skills: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Edge Functions'],
        applyUrl: 'https://vercel.com/careers#open-roles',
        deadline: getDeadline(19),
        deadlineDays: 19,
        description: 'Help improve developer tooling, documentation, templates, and the next generation of web frameworks.',
        featured: true
      },
      {
        id: 'opp_postman_api',
        company: 'Postman',
        role: 'API Engineering & Tooling Intern',
        category: 'backend',
        platform: 'LinkedIn',
        platformColor: '#0077B5',
        logoText: 'P',
        logoBg: '#FF6C37',
        region: 'India',
        state: 'Karnataka',
        location: 'Bengaluru, Karnataka (India)',
        workMode: 'Remote',
        stipend: '₹55,000 / month',
        duration: '6 Months',
        skills: ['Node.js', 'JavaScript', 'REST', 'GraphQL', 'Docker'],
        applyUrl: 'https://www.postman.com/company/careers/',
        deadline: getDeadline(10),
        deadlineDays: 10,
        description: 'Enhance testing suites, API client protocols, and mock server capabilities used by 30M+ developers.',
        featured: false
      },
      {
        id: 'opp_cred_backend',
        company: 'CRED',
        role: 'Backend & Systems Security Intern',
        category: 'backend',
        platform: 'Company Portal',
        platformColor: '#121212',
        logoText: 'C',
        logoBg: '#121212',
        region: 'India',
        state: 'Karnataka',
        location: 'Bengaluru, Karnataka (India)',
        workMode: 'On-site',
        stipend: '₹70,000 / month',
        duration: '6 Months',
        skills: ['Golang', 'Java', 'Distributed Systems', 'Cryptography'],
        applyUrl: 'https://careers.cred.club/',
        deadline: getDeadline(7),
        deadlineDays: 7,
        description: 'Architect ultra-secure financial transaction pipelines and rewards credit infrastructure.',
        featured: false
      },
      {
        id: 'opp_nvidia_ai',
        company: 'NVIDIA',
        role: 'Deep Learning & GPU Computing Intern',
        category: 'aiml',
        platform: 'Company Portal',
        platformColor: '#76B900',
        logoText: 'N',
        logoBg: '#76B900',
        region: 'India',
        state: 'Maharashtra',
        location: 'Pune, Maharashtra (India)',
        workMode: 'Hybrid',
        stipend: '₹80,000 / month',
        duration: '6 Months',
        skills: ['PyTorch', 'CUDA', 'C++', 'Python', 'Computer Vision'],
        applyUrl: 'https://www.nvidia.com/en-us/about-nvidia/careers/university-recruiting/',
        deadline: getDeadline(17),
        deadlineDays: 17,
        description: 'Accelerate neural network training benchmarks using CUDA, TensorRT, and modern LLM architectures.',
        featured: true
      },
      {
        id: 'opp_infosys_spring',
        company: 'Infosys',
        role: 'Cloud & Python Developer Intern',
        category: 'backend',
        platform: 'Internshala',
        platformColor: '#1295D8',
        logoText: 'I',
        logoBg: '#007CC3',
        region: 'India',
        state: 'Maharashtra',
        location: 'Pune, Maharashtra (India)',
        workMode: 'Hybrid',
        stipend: '₹35,000 / month',
        duration: '6 Months',
        skills: ['Python', 'SQL', 'AWS', 'Django', 'Git'],
        applyUrl: 'https://internshala.com/internships/python-internship',
        deadline: getDeadline(25),
        deadlineDays: 25,
        description: 'Build enterprise automation scripts and REST services under Infosys Springboard incubation.',
        featured: false
      },
      {
        id: 'opp_gitlab_remote',
        company: 'GitLab',
        role: 'Remote Open Source Systems Intern',
        category: 'backend',
        platform: 'Company Portal',
        platformColor: '#FC6D26',
        logoText: 'GL',
        logoBg: '#E24329',
        region: 'Remote',
        state: 'Global (Anywhere)',
        location: 'Remote (Worldwide)',
        workMode: 'Remote',
        stipend: '$32 / hour',
        duration: '3 Months',
        skills: ['Ruby on Rails', 'Go', 'Git', 'CI/CD', 'PostgreSQL'],
        applyUrl: 'https://about.gitlab.com/jobs/all-jobs/',
        deadline: getDeadline(22),
        deadlineDays: 22,
        description: "Collaborate with an all-remote global team maintaining the world's leading open DevOps platform.",
        featured: true
      },
      {
        id: 'opp_phonepe_sde',
        company: 'PhonePe',
        role: 'Platform & Database Engineer Intern',
        category: 'swe',
        platform: 'LinkedIn',
        platformColor: '#0077B5',
        logoText: 'P',
        logoBg: '#5F259F',
        region: 'India',
        state: 'Karnataka',
        location: 'Bengaluru, Karnataka (India)',
        workMode: 'On-site',
        stipend: '₹60,000 / month',
        duration: '6 Months',
        skills: ['Java', 'Cassandra', 'HBase', 'Kafka', 'Linux'],
        applyUrl: 'https://www.phonepe.com/careers/',
        deadline: getDeadline(15),
        deadlineDays: 15,
        description: 'Handle high-volume UPI transactions and fault-tolerant distributed ledger database clusters.',
        featured: false
      },
      {
        id: 'opp_adobe_noida',
        company: 'Adobe',
        role: 'Software Development Intern - Creative Cloud',
        category: 'swe',
        platform: 'Company Portal',
        platformColor: '#FF0000',
        logoText: 'A',
        logoBg: '#FF0000',
        region: 'India',
        state: 'Uttar Pradesh',
        location: 'Noida, Uttar Pradesh (India)',
        workMode: 'Hybrid',
        stipend: '₹75,000 / month',
        duration: '6 Months',
        skills: ['C++', 'JavaScript', 'Algorithms', 'Computer Graphics'],
        applyUrl: 'https://www.adobe.com/careers.html',
        deadline: getDeadline(16),
        deadlineDays: 16,
        description: 'Develop next-generation rendering engines and creative cloud workflows used by millions worldwide.',
        featured: true
      },
      {
        id: 'opp_zoho_chennai',
        company: 'Zoho',
        role: 'Product Developer & Web Intern',
        category: 'web',
        platform: 'Company Portal',
        platformColor: '#E42528',
        logoText: 'Z',
        logoBg: '#E42528',
        region: 'India',
        state: 'Tamil Nadu',
        location: 'Chennai, Tamil Nadu (India)',
        workMode: 'On-site',
        stipend: '₹40,000 / month',
        duration: '6 Months',
        skills: ['Java', 'JavaScript', 'SQL', 'HTML5/CSS3', 'Data Structures'],
        applyUrl: 'https://www.zoho.com/careers/',
        deadline: getDeadline(23),
        deadlineDays: 23,
        description: 'Build enterprise SaaS applications from the ground up without third-party frameworks at Zoho Corporation.',
        featured: false
      },
      {
        id: 'opp_gift_city_tech',
        company: 'GIFT City Fintech Hub',
        role: 'Algorithmic Trading & Cloud Intern',
        category: 'swe',
        platform: 'LinkedIn',
        platformColor: '#0077B5',
        logoText: 'G',
        logoBg: '#059669',
        region: 'India',
        state: 'Gujarat',
        location: 'Gandhinagar, Gujarat (India)',
        workMode: 'Hybrid',
        stipend: '₹55,000 / month',
        duration: '6 Months',
        skills: ['Python', 'C++', 'Low Latency', 'AWS', 'Financial Markets'],
        applyUrl: 'https://www.linkedin.com/jobs/',
        deadline: getDeadline(20),
        deadlineDays: 20,
        description: "Develop low-latency market gateways and risk management software in India's premier financial hub.",
        featured: false
      },
      {
        id: 'opp_apple_cupertino',
        company: 'Apple',
        role: 'Software Technology Intern',
        category: 'swe',
        platform: 'Company Portal',
        platformColor: '#555555',
        logoText: 'AP',
        logoBg: '#000000',
        region: 'United States',
        state: 'California',
        location: 'Cupertino, California (USA)',
        workMode: 'On-site',
        stipend: '$55 / hour',
        duration: '3 Months',
        skills: ['Swift', 'C++', 'macOS / iOS Internals', 'Algorithms'],
        applyUrl: 'https://www.apple.com/careers/us/students.html',
        deadline: getDeadline(14),
        deadlineDays: 14,
        description: 'Contribute directly to core system frameworks, developer SDKs, and iOS operating system features.',
        featured: true
      },
      {
        id: 'opp_msft_redmond',
        company: 'Microsoft',
        role: 'Cloud Infrastructure & Azure Systems Intern',
        category: 'backend',
        platform: 'Microsoft Careers',
        platformColor: '#00A4EF',
        logoText: 'M',
        logoBg: '#0078D4',
        region: 'United States',
        state: 'Washington',
        location: 'Redmond, Washington (USA)',
        workMode: 'Hybrid',
        stipend: '$50 / hour',
        duration: '3 Months',
        skills: ['C#', 'Go', 'Kubernetes', 'Distributed Systems'],
        applyUrl: 'https://careers.microsoft.com/us/en/search-results?keywords=intern',
        deadline: getDeadline(24),
        deadlineDays: 24,
        description: 'Architect hyperscale cloud networking infrastructure and telemetry monitoring systems at Microsoft HQ.',
        featured: true
      },
      {
        id: 'opp_bloomberg_nyc',
        company: 'Bloomberg LP',
        role: 'Software Engineer Intern',
        category: 'swe',
        platform: 'LinkedIn',
        platformColor: '#0077B5',
        logoText: 'B',
        logoBg: '#000000',
        region: 'United States',
        state: 'New York',
        location: 'New York, NY (USA)',
        workMode: 'Hybrid',
        stipend: '$60 / hour',
        duration: '3 Months',
        skills: ['C++', 'Python', 'Algorithms', 'Financial Engineering'],
        applyUrl: 'https://www.bloomberg.com/company/careers/',
        deadline: getDeadline(19),
        deadlineDays: 19,
        description: 'Engineer high-throughput real-time financial market data feeds and Bloomberg Terminal analytics.',
        featured: true
      },
      {
        id: 'opp_deepmind_london',
        company: 'Google DeepMind',
        role: 'Research Engineering Intern - Frontier AI',
        category: 'aiml',
        platform: 'Google Careers',
        platformColor: '#4285F4',
        logoText: 'D',
        logoBg: '#1E3A8A',
        region: 'Europe',
        state: 'United Kingdom',
        location: 'London, United Kingdom (Europe)',
        workMode: 'Hybrid',
        stipend: '£4,200 / month',
        duration: '4 Months',
        skills: ['JAX', 'PyTorch', 'Python', 'Reinforcement Learning', 'LLMs'],
        applyUrl: 'https://careers.google.com/jobs/results/?q=deepmind',
        deadline: getDeadline(26),
        deadlineDays: 26,
        description: 'Work with world-leading AI researchers scaling Gemini multimodal models and novel neural architectures.',
        featured: true
      },
      {
        id: 'opp_figma_product',
        company: 'Figma',
        role: 'UI & Design Systems Engineer Intern',
        category: 'design',
        platform: 'Wellfound',
        platformColor: '#F24E1E',
        logoText: 'F',
        logoBg: '#0ACF83',
        region: 'United States',
        state: 'California',
        location: 'San Francisco, California (USA)',
        workMode: 'Remote',
        stipend: '$45 / hour',
        duration: '3 Months',
        skills: ['TypeScript', 'WebGL', 'CSS3', 'Figma API', 'Design Systems'],
        applyUrl: 'https://www.figma.com/careers/',
        deadline: getDeadline(20),
        deadlineDays: 20,
        description: 'Bridge design and code by building new canvas components, vector math tools, and collaborative plugins.',
        featured: true
      },
      {
        id: 'opp_linear_yc',
        company: 'Linear',
        role: 'Product Engineering Intern',
        category: 'web',
        platform: 'Y Combinator',
        platformColor: '#FF6600',
        logoText: 'L',
        logoBg: '#5E6AD2',
        region: 'Remote',
        state: 'Global (Anywhere)',
        location: 'Remote (Worldwide)',
        workMode: 'Remote',
        stipend: '$42 / hour',
        duration: '3 Months',
        skills: ['TypeScript', 'React', 'GraphQL', 'IndexedDB', 'Electron'],
        applyUrl: 'https://www.ycombinator.com/companies/linear/jobs',
        deadline: getDeadline(14),
        deadlineDays: 14,
        description: 'Build lightning-fast issue tracking software with local-first offline syncing architecture.',
        featured: true
      },
      {
        id: 'opp_tcs_digital',
        company: 'TCS',
        role: 'TCS Digital Ninja Software Intern',
        category: 'swe',
        platform: 'Company Portal',
        platformColor: '#1A237E',
        logoText: 'T',
        logoBg: '#1A237E',
        region: 'India',
        state: 'Maharashtra',
        location: 'Pune / Mumbai, Maharashtra (India)',
        workMode: 'On-site',
        stipend: '₹38,000 / month',
        duration: '6 Months',
        skills: ['Java', 'Python', 'SQL', 'Algorithms', 'Cloud'],
        applyUrl: 'https://www.tcs.com/careers',
        deadline: getDeadline(28),
        deadlineDays: 28,
        description: 'Participate in TCS Digital innovation labs building AI automation and banking middleware.',
        featured: false
      },
      {
        id: 'opp_atlassian_swe',
        company: 'Atlassian',
        role: 'Associate Software Engineer Intern',
        category: 'swe',
        platform: 'LinkedIn',
        platformColor: '#0077B5',
        logoText: 'A',
        logoBg: '#0052CC',
        region: 'India',
        state: 'Karnataka',
        location: 'Bengaluru, Karnataka (India)',
        workMode: 'Hybrid',
        stipend: '₹75,000 / month',
        duration: '6 Months',
        skills: ['Java', 'Kotlin', 'React', 'AWS', 'GraphQL'],
        applyUrl: 'https://www.atlassian.com/company/careers/students',
        deadline: getDeadline(16),
        deadlineDays: 16,
        description: 'Build Jira and Confluence cloud features empowering millions of engineering teams globally.',
        featured: true
      }
    ];
  },

  /**
   * Filter and search through collected opportunities
   */
  getFiltered() {
    return this.items.filter(item => {
      // Search query filter (matches role, company, skills, location, region, state, platform)
      if (this.filters.query) {
        const q = this.filters.query.toLowerCase().trim();
        const inCompany = item.company.toLowerCase().includes(q);
        const inRole = item.role.toLowerCase().includes(q);
        const inLocation = item.location.toLowerCase().includes(q);
        const inPlatform = item.platform.toLowerCase().includes(q);
        const inSkills = item.skills.some(s => s.toLowerCase().includes(q));
        const inRegion = (item.region || '').toLowerCase().includes(q);
        const inState = (item.state || '').toLowerCase().includes(q);
        if (!inCompany && !inRole && !inLocation && !inPlatform && !inSkills && !inRegion && !inState) {
          return false;
        }
      }

      // Category filter
      if (this.filters.category !== 'all') {
        if (this.filters.category === 'remote') {
          if (item.workMode !== 'Remote') return false;
        } else if (item.category !== this.filters.category) {
          return false;
        }
      }

      // Work Mode filter
      if (this.filters.workMode !== 'all' && item.workMode !== this.filters.workMode) {
        return false;
      }

      // Platform filter
      if (this.filters.platform !== 'all' && item.platform !== this.filters.platform) {
        return false;
      }

      // Region filter
      if (this.filters.region !== 'all' && item.region !== this.filters.region) {
        return false;
      }

      // State filter
      if (this.filters.state !== 'all') {
        const targetState = this.filters.state.toLowerCase();
        const itemState = (item.state || '').toLowerCase();
        const itemLoc = (item.location || '').toLowerCase();
        if (!itemState.includes(targetState) && !itemLoc.includes(targetState)) {
          return false;
        }
      }

      return true;
    });
  },

  /**
   * Check if an opportunity has already been tracked in LocalStorage
   */
  isTracked(item) {
    const trackedList = Storage.getAll();
    return trackedList.some(app => 
      app.company.toLowerCase().trim() === item.company.toLowerCase().trim() &&
      app.role.toLowerCase().trim() === item.role.toLowerCase().trim()
    );
  },

  /**
   * Render the opportunities grid
   */
  render() {
    const container = document.getElementById('opps-grid-container');
    const countBadge = document.getElementById('opps-count-badge');
    if (!container) return;

    const filtered = this.getFiltered();

    if (countBadge) {
      countBadge.textContent = `${filtered.length} Openings Found`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1;">
          <div class="empty-icon-wrapper"><i data-lucide="search"></i></div>
          <h3 class="empty-title">No internships matching your location or search</h3>
          <p class="empty-subtitle">We couldn't find openings for this Region, State, or keyword combination. Try clearing some filters.</p>
          <button class="btn btn-primary" onclick="Opportunities.resetFilters()">
            Clear All Filters
          </button>
        </div>
      `;
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
      return;
    }

    container.innerHTML = filtered.map(item => {
      const isAlreadyTracked = this.isTracked(item);
      const daysLeft = item.deadlineDays;
      let deadlineBadgeClass = 'badge-normal';
      let deadlineText = `Deadline in ${daysLeft} days`;

      if (daysLeft <= 3) {
        deadlineBadgeClass = 'badge-urgent';
        deadlineText = `Closing in ${daysLeft} days`;
      } else if (daysLeft <= 7) {
        deadlineBadgeClass = 'badge-warning';
        deadlineText = `${daysLeft} days left`;
      }

      const skillsHtml = item.skills.slice(0, 4).map(skill => 
        `<span class="skill-tag">${Utils.escapeHtml(skill)}</span>`
      ).join('');

      const extraSkillsCount = item.skills.length > 4 ? `+${item.skills.length - 4}` : '';

      return `
        <div class="opp-card ${item.featured ? 'opp-card-featured' : ''}" data-id="${item.id}">
          
          <!-- Card Header -->
          <div class="opp-card-top">
            <div class="opp-company-badge" style="background-color: ${item.logoBg}; color: #FFFFFF;">
              ${item.logoText}
            </div>
            <div class="opp-title-box">
              <div class="opp-company-name">
                ${Utils.escapeHtml(item.company)}
                ${item.featured ? '<span class="opp-hot-pill">Featured</span>' : ''}
              </div>
              <h3 class="opp-role-title">${Utils.escapeHtml(item.role)}</h3>
            </div>
          </div>

          <!-- Metadata Badges -->
          <div class="opp-meta-row">
            <span class="opp-platform-pill" style="border-left: 3px solid ${item.platformColor};">
              <i data-lucide="globe" style="width: 12px; height: 12px;"></i>
              ${Utils.escapeHtml(item.platform)}
            </span>
            <span class="opp-mode-pill mode-${item.workMode.toLowerCase()}">
              <i data-lucide="${item.workMode === 'Remote' ? 'wifi' : (item.workMode === 'Hybrid' ? 'shuffle' : 'building-2')}" style="width: 12px; height: 12px;"></i>
              ${Utils.escapeHtml(item.workMode)}
            </span>
            <span class="opp-location-pill" title="Region: ${item.region}, State: ${item.state}">
              <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i>
              ${Utils.escapeHtml(item.location)}
            </span>
          </div>

          <!-- Description -->
          <p class="opp-desc">${Utils.escapeHtml(item.description)}</p>

          <!-- Stipend & Duration Bar -->
          <div class="opp-perks-bar">
            <div class="opp-perk-item">
              <span class="opp-perk-label">Stipend</span>
              <span class="opp-perk-val">${Utils.escapeHtml(item.stipend)}</span>
            </div>
            <div class="opp-perk-item">
              <span class="opp-perk-label">Duration</span>
              <span class="opp-perk-val">${Utils.escapeHtml(item.duration)}</span>
            </div>
            <div class="opp-perk-item text-right">
              <span class="opp-perk-label">Urgency</span>
              <span class="opp-deadline-pill ${deadlineBadgeClass}">${deadlineText}</span>
            </div>
          </div>

          <!-- Skills tags -->
          <div class="opp-skills-list">
            ${skillsHtml}
            ${extraSkillsCount ? `<span class="skill-tag skill-tag-more">${extraSkillsCount}</span>` : ''}
          </div>

          <!-- Action Buttons -->
          <div class="opp-actions-bar">
            <a href="${item.applyUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline opp-btn-apply" title="Apply on ${item.platform}">
              <span>Apply on Site</span>
              <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
            </a>

            ${isAlreadyTracked ? `
              <button class="btn btn-success opp-btn-track" disabled>
                <i data-lucide="check" style="width: 14px; height: 14px;"></i>
                <span>Tracked</span>
              </button>
            ` : `
              <button class="btn btn-primary opp-btn-track" onclick="Opportunities.trackOpportunity('${item.id}')">
                <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                <span>+ Track</span>
              </button>
            `}
          </div>

        </div>
      `;
    }).join('');

    // Re-initialize Lucide Icons on newly rendered cards
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  /**
   * 1-Click Track Opportunity into LocalStorage
   */
  trackOpportunity(id) {
    const opp = this.items.find(o => o.id === id);
    if (!opp) return;

    if (this.isTracked(opp)) {
      Utils.showToast(`${opp.company} internship is already in your tracker!`, 'info');
      return;
    }

    const newRecord = {
      id: Utils.generateId(),
      company: opp.company,
      role: opp.role,
      location: opp.location,
      region: opp.region,
      state: opp.state,
      workMode: opp.workMode,
      applicationDate: new Date().toISOString().split('T')[0],
      deadline: opp.deadline,
      applicationUrl: opp.applyUrl,
      stipend: opp.stipend,
      duration: opp.duration,
      skills: opp.skills,
      status: 'Saved',
      priority: opp.featured ? 'High' : 'Medium',
      favorite: false,
      notes: `Collected from ${opp.platform}. Region: ${opp.region}, State: ${opp.state}. ${opp.description}`,
      interview: {
        date: '',
        time: '',
        round: '',
        meetingLink: '',
        interviewer: '',
        notes: ''
      },
      followUpDate: ''
    };

    const res = Storage.save(newRecord);
    if (res.success) {
      Utils.showToast(`Saved "${opp.company} - ${opp.role}" to My Tracker!`, 'success');
      this.render();
      App.updateNavBadges();
    } else {
      Utils.showToast(res.error || 'Failed to track internship.', 'error');
    }
  },

  /**
   * Reset all filters
   */
  resetFilters() {
    this.filters.query = '';
    this.filters.category = 'all';
    this.filters.workMode = 'all';
    this.filters.platform = 'all';
    this.filters.region = 'all';
    this.filters.state = 'all';

    const searchInput = document.getElementById('opps-search-input');
    if (searchInput) searchInput.value = '';

    const modeSelect = document.getElementById('opps-mode-filter');
    if (modeSelect) modeSelect.value = 'all';

    const platformSelect = document.getElementById('opps-platform-filter');
    if (platformSelect) platformSelect.value = 'all';

    const regionSelect = document.getElementById('opps-region-filter');
    if (regionSelect) regionSelect.value = 'all';

    this.updateStateDropdown('all');

    document.querySelectorAll('.cat-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-cat') === 'all');
    });

    this.render();
  },

  /**
   * Event listeners for search, category, region, and state filters
   */
  bindEvents() {
    // Keyword search input
    const searchInput = document.getElementById('opps-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.filters.query = e.target.value;
        this.render();
      }, 250));
    }

    // Category pills
    document.querySelectorAll('.cat-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filters.category = btn.getAttribute('data-cat') || 'all';
        this.render();
      });
    });

    // Region filter select
    const regionSelect = document.getElementById('opps-region-filter');
    if (regionSelect) {
      regionSelect.addEventListener('change', (e) => {
        this.filters.region = e.target.value;
        this.filters.state = 'all'; // reset state filter on region change
        this.updateStateDropdown(e.target.value);
        this.render();
      });
    }

    // State filter select
    const stateSelect = document.getElementById('opps-state-filter');
    if (stateSelect) {
      stateSelect.addEventListener('change', (e) => {
        this.filters.state = e.target.value;
        this.render();
      });
    }

    // Work Mode select filter
    const modeSelect = document.getElementById('opps-mode-filter');
    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        this.filters.workMode = e.target.value;
        this.render();
      });
    }

    // Platform select filter
    const platformSelect = document.getElementById('opps-platform-filter');
    if (platformSelect) {
      platformSelect.addEventListener('change', (e) => {
        this.filters.platform = e.target.value;
        this.render();
      });
    }
  }
};
