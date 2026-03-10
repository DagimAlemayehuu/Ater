/**
 * Profiles Schema Definition
 * 
 * General-purpose schemas that work for any user.
 * Every field asks ONE atomic question. Labels match the MD templates exactly.
 */

export interface ProfileField {
    label: string;
    question: string;
    value: string;
}

export interface ProfileSection {
    title: string;
    fields: ProfileField[];
}

export const PERSONAL_PROFILE_SCHEMA: ProfileSection[] = [
    {
        title: "Identity & Background",
        fields: [
            { label: "Full Name", question: "What is your full name?", value: "" },
            { label: "Age", question: "How old are you?", value: "" },
            { label: "Birthday", question: "When is your birthday?", value: "" },
            { label: "Nationality", question: "What is your nationality?", value: "" },
            { label: "Current City", question: "What city do you currently live in?", value: "" },
            { label: "Current Country", question: "What country do you currently live in?", value: "" },
        ]
    },
    {
        title: "Living Situation",
        fields: [
            { label: "Who You Live With", question: "Who do you currently live with?", value: "" },
            { label: "Housing Type", question: "What is your housing situation? (apartment, house, dorm, etc.)", value: "" },
            { label: "Family Members", question: "List your immediate family members.", value: "" },
            { label: "Family Responsibilities", question: "What responsibilities do you have towards your family?", value: "" },
            { label: "Languages Spoken", question: "What languages do you speak fluently?", value: "" },
            { label: "Religion/Spirituality", question: "What is your religious or spiritual background?", value: "" },
        ]
    },
    {
        title: "Daily Tools & Access",
        fields: [
            { label: "Primary Devices", question: "What devices do you use daily for work or study?", value: "" },
            { label: "Internet Reliability", question: "How reliable is your internet access?", value: "" },
            { label: "Power/Electricity Reliability", question: "How reliable is your electricity access?", value: "" },
            { label: "Key Apps & Tools", question: "What apps and tools do you rely on most daily?", value: "" },
        ]
    },
    {
        title: "Daily Rhythm",
        fields: [
            { label: "Wake Up Time", question: "What time do you usually wake up?", value: "" },
            { label: "Bedtime", question: "What time do you usually go to bed?", value: "" },
            { label: "Peak Energy Hours", question: "What time of day are you most productive?", value: "" },
            { label: "Low Energy Hours", question: "What time of day do you feel most tired?", value: "" },
            { label: "Morning Routine", question: "Describe your morning from waking up to starting your day.", value: "" },
            { label: "Evening Routine", question: "Describe your evening before bed.", value: "" },
        ]
    },
    {
        title: "Motivation & Drive",
        fields: [
            { label: "Life Vision (3-5 Years)", question: "Describe your ideal life in 3-5 years in vivid detail.", value: "" },
            { label: "Nightmare Scenario If Nothing Changes", question: "What happens if you fail to change and stay where you are?", value: "" },
            { label: "Primary Motivator", question: "What single thing drives you more than anything else?", value: "" },
            { label: "What Makes You Take Action", question: "What internal or external triggers get you to actually take action?", value: "" },
        ]
    },
    {
        title: "Discipline & Weaknesses",
        fields: [
            { label: "Biggest Obstacle to Discipline", question: "What is your single biggest obstacle to staying disciplined?", value: "" },
            { label: "What Causes You to Quit", question: "What specifically causes you to abandon a plan or goal?", value: "" },
            { label: "Overthinking Tendencies", question: "Do you overthink decisions? Give an example.", value: "" },
            { label: "Comparison Habits", question: "Do you compare yourself to others? How does it affect you?", value: "" },
            { label: "Validation-Seeking Tendencies", question: "Do you need approval from others before acting?", value: "" },
        ]
    },
    {
        title: "Career & Ambition",
        fields: [
            { label: "Dream Career", question: "What career or role are you working towards?", value: "" },
            { label: "Target Monthly Income", question: "How much monthly income would make you financially comfortable?", value: "" },
            { label: "Preferred Work Style", question: "Do you prefer employment, freelancing, or building your own business?", value: "" },
            { label: "Risk Tolerance", question: "How comfortable are you taking calculated risks?", value: "" },
        ]
    },
    {
        title: "Health Snapshot",
        fields: [
            { label: "Current Weight", question: "What is your current body weight?", value: "" },
            { label: "Height", question: "What is your height?", value: "" },
            { label: "Daily Energy Level", question: "How would you describe your daily energy level? (Low/Medium/High)", value: "" },
            { label: "Current Fitness Goal", question: "What is your current fitness or physique target?", value: "" },
            { label: "Typical Daily Diet", question: "Describe what you typically eat in a day.", value: "" },
            { label: "Sleep Quality", question: "How would you rate your sleep quality and consistency?", value: "" },
        ]
    },
    {
        title: "Social Life",
        fields: [
            { label: "How Often You Socialize", question: "How often do you socialize each week?", value: "" },
            { label: "What You Want From Friendships", question: "What do you want to build in terms of friendships or networks?", value: "" },
            { label: "Values in Close Friends", question: "What values do you look for in close friends?", value: "" },
            { label: "Values in a Partner", question: "What qualities do you value in a romantic partner?", value: "" },
            { label: "Biggest Social Struggle", question: "What is your biggest social struggle?", value: "" },
            { label: "How You Handle Conflict", question: "How do you handle arguments or disagreements?", value: "" },
        ]
    },
    {
        title: "Habits & Time",
        fields: [
            { label: "Creative Hobbies", question: "What hobbies or creative activities do you enjoy?", value: "" },
            { label: "Top Time Waster", question: "What single activity wastes the most of your time?", value: "" },
            { label: "Daily Phone Screen Time", question: "How many hours per day do you spend on your phone non-productively?", value: "" },
            { label: "What You Do When Bored", question: "What do you typically do when you have nothing planned?", value: "" },
            { label: "Tracking Systems Used", question: "What systems do you use for life tracking, habits, or budgeting?", value: "" },
        ]
    },
    {
        title: "Emotional Patterns",
        fields: [
            { label: "How You Handle Stress", question: "How do you typically cope with stress?", value: "" },
            { label: "Hardest Emotion to Manage", question: "Which emotion is hardest for you to manage?", value: "" },
            { label: "Internal Self-Talk When Things Go Wrong", question: "What does your inner voice say when things go wrong?", value: "" },
            { label: "How Fast You Recover From Failure", question: "How quickly do you recover from disappointment or failure?", value: "" },
        ]
    },
    {
        title: "Learning & Growth",
        fields: [
            { label: "Primary Skill Being Developed", question: "What is the main skill you are developing right now?", value: "" },
            { label: "Biggest Learning Strength", question: "What are you best at when learning on your own?", value: "" },
            { label: "Biggest Learning Weakness", question: "Where do you struggle most when learning independently?", value: "" },
            { label: "Reaction to Plateaus", question: "How do you react when you stop seeing progress?", value: "" },
        ]
    },
    {
        title: "Core Values",
        fields: [
            { label: "Value #1", question: "What is your most important personal value?", value: "" },
            { label: "Value #2", question: "What is your second most important value?", value: "" },
            { label: "Value #3", question: "What is your third most important value?", value: "" },
            { label: "Self-Description in One Sentence", question: "In one sentence, how do you see yourself?", value: "" },
            { label: "Personality Type", question: "What is your personality type? (MBTI, Enneagram, etc.)", value: "" },
            { label: "Most Formative Experience", question: "What single past experience shaped who you are the most?", value: "" },
        ]
    },
    {
        title: "Life Purpose",
        fields: [
            { label: "Personal Purpose", question: "What is your overarching 'Why' in life?", value: "" },
            { label: "Top Priority Right Now", question: "What is the single most important thing in your life right now?", value: "" },
            { label: "How You Define Success", question: "How do you personally define success?", value: "" },
            { label: "Philosophy on Happiness", question: "What is your personal approach to achieving happiness?", value: "" },
        ]
    }
];

export const ACADEMIC_PROFILE_SCHEMA: ProfileSection[] = [
    {
        title: "Current Enrollment",
        fields: [
            { label: "Degree Program", question: "What degree are you currently pursuing? (e.g., Bachelor's, Master's)", value: "" },
            { label: "Major/Field of Study", question: "What is your major or primary field of study?", value: "" },
            { label: "Institution", question: "What institution are you currently attending?", value: "" },
            { label: "Year of Study", question: "What year of study are you in?", value: "" },
            { label: "Current Semester/Term", question: "Which semester or term are you currently in?", value: "" },
            { label: "Expected Graduation Date", question: "When do you expect to graduate?", value: "" },
        ]
    },
    {
        title: "Academic Performance",
        fields: [
            { label: "Current CGPA", question: "What is your current Cumulative GPA?", value: "" },
            { label: "Target Graduation GPA", question: "What GPA do you want to graduate with?", value: "" },
            { label: "Minimum Acceptable Grade Per Course", question: "What is the lowest grade you'll accept in any course?", value: "" },
            { label: "Total Credits Completed", question: "How many total credit hours have you completed?", value: "" },
            { label: "Total Credits Required", question: "How many total credit hours does your degree require?", value: "" },
        ]
    },
    {
        title: "Previous Education",
        fields: [
            { label: "Previous Institution", question: "Where did you study before your current institution?", value: "" },
            { label: "Previous GPA", question: "What was your GPA at your previous institution?", value: "" },
            { label: "Degree or Level Completed", question: "What degree or level did you complete previously?", value: "" },
            { label: "Key Takeaways From Previous Studies", question: "What were the most important lessons from your previous education?", value: "" },
        ]
    },
    {
        title: "Current Semester",
        fields: [
            { label: "Term Start Date", question: "When does your current term start?", value: "" },
            { label: "Term End Date", question: "When does the current term end?", value: "" },
            { label: "Registration Date", question: "When is/was your registration date?", value: "" },
            { label: "Midterm Period", question: "When is the midterm exam period?", value: "" },
            { label: "Final Exam Period", question: "When is the final exam period?", value: "" },
        ]
    },
    {
        title: "Coursework",
        fields: [
            { label: "Current Courses", question: "List all your current courses.", value: "" },
            { label: "Total Credit Hours This Semester", question: "How many total credit hours are you taking this semester?", value: "" },
            { label: "Hardest Course", question: "Which course do you consider the most difficult?", value: "" },
            { label: "Why It's Hard", question: "Why is this course particularly challenging for you?", value: "" },
            { label: "Easiest Course", question: "Which course do you consider the easiest?", value: "" },
            { label: "Most Important Course for Career", question: "Which course is most critical for your long-term career?", value: "" },
        ]
    },
    {
        title: "Study Habits",
        fields: [
            { label: "How You Take Notes", question: "How do you take notes during lectures?", value: "" },
            { label: "When You Review Material After Class", question: "How soon after class do you review the material?", value: "" },
            { label: "Active Recall Method", question: "What technique do you use for active recall and self-testing?", value: "" },
            { label: "How You Organize Notes", question: "How do you organize and archive your study notes?", value: "" },
            { label: "How Many Hours You Study Per Day", question: "How many hours do you typically study each day?", value: "" },
        ]
    },
    {
        title: "Academic Strengths",
        fields: [
            { label: "Biggest Academic Strength", question: "What is your single biggest academic strength?", value: "" },
            { label: "Best Subject Area", question: "What subject area do you naturally excel in?", value: "" },
            { label: "What Type of Assignments You Excel At", question: "What types of assignments do you perform best on?", value: "" },
        ]
    },
    {
        title: "Academic Risks",
        fields: [
            { label: "Biggest Academic Weakness", question: "What is your biggest academic weakness?", value: "" },
            { label: "What Hurts Your Grades Most", question: "What internal trait is most likely to hurt your grades?", value: "" },
            { label: "External Threats to Performance", question: "What external factor most threatens your academic performance?", value: "" },
            { label: "How You Plan to Manage Risks", question: "How do you plan to manage your biggest academic risks?", value: "" },
        ]
    },
    {
        title: "Career Alignment",
        fields: [
            { label: "How Your Degree Connects to Career", question: "How does your current degree connect to your dream career?", value: "" },
            { label: "Most Career-Relevant Course", question: "Which course provides the most direct career value?", value: "" },
            { label: "Research Interests", question: "Do you have any specific research interests?", value: "" },
            { label: "Capstone/Senior Project Ideas", question: "What are your ideas for a capstone or senior project?", value: "" },
        ]
    },
    {
        title: "Strategic Priorities",
        fields: [
            { label: "Priority Subject #1", question: "What is your highest priority subject this semester?", value: "" },
            { label: "Priority Subject #2", question: "What is your second priority subject?", value: "" },
            { label: "Priority Subject #3", question: "What is your third priority subject?", value: "" },
            { label: "Weekly Study Schedule Summary", question: "Briefly describe your weekly study schedule.", value: "" },
        ]
    }
];

export const FINANCIAL_PROFILE_SCHEMA: ProfileSection[] = [
    {
        title: "Income",
        fields: [
            { label: "Primary Income Source", question: "What is your main source of income?", value: "" },
            { label: "Primary Monthly Amount", question: "How much do you receive monthly from your primary source?", value: "" },
            { label: "Secondary Income Source", question: "Do you have a secondary income source? What is it?", value: "" },
            { label: "Secondary Monthly Amount", question: "How much do you earn monthly from your secondary source?", value: "" },
            { label: "Total Monthly Income", question: "What is your total combined monthly income?", value: "" },
        ]
    },
    {
        title: "Savings & Safety Net",
        fields: [
            { label: "Total Current Savings", question: "How much total savings do you have right now?", value: "" },
            { label: "Emergency Fund Amount", question: "How much do you have in an emergency fund?", value: "" },
            { label: "Target Emergency Fund", question: "What is your target emergency fund amount?", value: "" },
            { label: "Liquid Cash Available", question: "How much readily available cash do you have?", value: "" },
        ]
    },
    {
        title: "Debt",
        fields: [
            { label: "Total Outstanding Debt", question: "What is your total outstanding debt? (0 if none)", value: "" },
            { label: "Monthly Debt Payments", question: "How much do you pay monthly towards debt?", value: "" },
            { label: "Highest Interest Rate", question: "What is the highest interest rate on your debts?", value: "" },
            { label: "Debt Payoff Strategy", question: "What is your strategy for paying off debt?", value: "" },
        ]
    },
    {
        title: "Monthly Expenses",
        fields: [
            { label: "Housing/Rent", question: "How much do you spend on housing or rent per month?", value: "" },
            { label: "Food & Groceries", question: "How much do you spend on food per month?", value: "" },
            { label: "Transportation", question: "How much do you spend on transportation per month?", value: "" },
            { label: "Subscriptions & Services", question: "What are your total monthly subscription costs?", value: "" },
            { label: "Education/Tuition", question: "How much do you spend on education per month?", value: "" },
            { label: "Other Recurring Costs", question: "List any other recurring monthly expenses.", value: "" },
            { label: "Total Monthly Expenses", question: "What is your total combined monthly expenses?", value: "" },
        ]
    },
    {
        title: "Cash Flow",
        fields: [
            { label: "Net Monthly Surplus/Deficit", question: "After all expenses, how much do you have left each month?", value: "" },
            { label: "Expenses Covered By Others", question: "Which expenses are currently covered by someone else?", value: "" },
            { label: "Budgeting Method Used", question: "What budgeting method do you use?", value: "" },
        ]
    },
    {
        title: "Financial Goals",
        fields: [
            { label: "Main Financial Goal", question: "What is your primary financial goal right now?", value: "" },
            { label: "Financial Independence Target Income", question: "How much monthly income do you need to be fully self-sufficient?", value: "" },
            { label: "Target Timeline", question: "By when do you want to achieve financial independence?", value: "" },
            { label: "Monthly Investment Goal", question: "How much do you want to invest monthly?", value: "" },
        ]
    },
    {
        title: "Long-Term Wealth",
        fields: [
            { label: "10-Year Financial Vision", question: "What does financial success look like to you in 10 years?", value: "" },
            { label: "Portfolio/Investment Goals", question: "What type of investment portfolio do you want to build?", value: "" },
            { label: "Family Support Goals", question: "How much financial support do you want to provide to your family?", value: "" },
            { label: "Philanthropy Goals", question: "Do you have any charitable giving goals?", value: "" },
        ]
    },
    {
        title: "Strategy & Systems",
        fields: [
            { label: "Income Growth Strategy", question: "What is your primary strategy for increasing income?", value: "" },
            { label: "Skills You Can Monetize", question: "Which skills can you monetize right now or soon?", value: "" },
            { label: "Expense Tracking Tool", question: "What tool do you use for tracking expenses?", value: "" },
            { label: "How Often You Review Finances", question: "How often do you review your financial progress?", value: "" },
        ]
    },
    {
        title: "Money Mindset",
        fields: [
            { label: "Core Financial Motivator", question: "What drives your financial ambition the most?", value: "" },
            { label: "Biggest Spending Weakness", question: "What spending habit hurts you the most?", value: "" },
            { label: "Impulse Spending Triggers", question: "What triggers you to spend impulsively?", value: "" },
            { label: "Impulse Control Strategy", question: "What strategy do you use to resist impulsive purchases?", value: "" },
        ]
    }
];

export const FITNESS_PROFILE_SCHEMA: ProfileSection[] = [
    {
        title: "Body Measurements",
        fields: [
            { label: "Current Weight", question: "What is your current body weight? (include unit)", value: "" },
            { label: "Height", question: "What is your height? (include unit)", value: "" },
            { label: "BMI", question: "What is your current BMI?", value: "" },
            { label: "Body Fat Estimate", question: "What is your estimated body fat percentage?", value: "" },
            { label: "Chest", question: "What is your chest measurement?", value: "" },
            { label: "Waist", question: "What is your waist measurement?", value: "" },
            { label: "Hips", question: "What is your hip measurement?", value: "" },
        ]
    },
    {
        title: "Arm Measurements",
        fields: [
            { label: "Right Bicep Relaxed", question: "What is your right bicep measurement when relaxed?", value: "" },
            { label: "Left Bicep Relaxed", question: "What is your left bicep measurement when relaxed?", value: "" },
            { label: "Right Bicep Flexed", question: "What is your right bicep measurement when flexed?", value: "" },
            { label: "Left Bicep Flexed", question: "What is your left bicep measurement when flexed?", value: "" },
            { label: "Right Forearm", question: "What is your right forearm measurement?", value: "" },
            { label: "Left Forearm", question: "What is your left forearm measurement?", value: "" },
        ]
    },
    {
        title: "Leg Measurements",
        fields: [
            { label: "Right Thigh", question: "What is your right thigh measurement?", value: "" },
            { label: "Left Thigh", question: "What is your left thigh measurement?", value: "" },
            { label: "Right Calf", question: "What is your right calf measurement?", value: "" },
            { label: "Left Calf", question: "What is your left calf measurement?", value: "" },
        ]
    },
    {
        title: "Health Baseline",
        fields: [
            { label: "Max Push-ups", question: "How many push-ups can you do with proper form?", value: "" },
            { label: "Daily Energy Level", question: "How would you rate your average daily energy? (1-10)", value: "" },
            { label: "Known Health Issues or Injuries", question: "Do you have any injuries, joint issues, or health concerns?", value: "" },
            { label: "Activity Level Outside Exercise", question: "How active is your lifestyle outside of formal exercise?", value: "" },
        ]
    },
    {
        title: "Posture",
        fields: [
            { label: "Forward Head Posture", question: "Do you have forward head posture?", value: "" },
            { label: "Rounded Shoulders", question: "Do your shoulders round forward when standing naturally?", value: "" },
            { label: "Shoulder Blade Winging", question: "Do your shoulder blades stick out from your back?", value: "" },
            { label: "Pelvic Tilt Issues", question: "Do you have anterior pelvic tilt?", value: "" },
        ]
    },
    {
        title: "Physique Goals",
        fields: [
            { label: "Target Weight", question: "What is your target body weight?", value: "" },
            { label: "Target Body Fat", question: "What is your target body fat percentage?", value: "" },
            { label: "Physique Vision", question: "Describe your ideal physique in one sentence.", value: "" },
            { label: "Goal Timeline", question: "By when do you want to reach your physique goal?", value: "" },
        ]
    },
    {
        title: "Training Plan",
        fields: [
            { label: "Gym Days Per Week", question: "How many days per week can you go to the gym?", value: "" },
            { label: "Training Focus", question: "What is your training focus: strength, hypertrophy, or endurance?", value: "" },
            { label: "Workout Split", question: "What muscle group split do you follow or plan to follow?", value: "" },
            { label: "Equipment Available", question: "What equipment does your gym have?", value: "" },
            { label: "Cardio Strategy", question: "What is your plan for cardiovascular exercise?", value: "" },
            { label: "Progressive Overload Method", question: "How do you plan to implement progressive overload?", value: "" },
        ]
    },
    {
        title: "Nutrition",
        fields: [
            { label: "Meals Per Day", question: "How many meals do you eat per day?", value: "" },
            { label: "Primary Protein Sources", question: "What are your main protein sources?", value: "" },
            { label: "Caloric Strategy", question: "Are you bulking, cutting, or maintaining?", value: "" },
            { label: "Dietary Restrictions", question: "Do you have any dietary restrictions or fasting periods?", value: "" },
            { label: "Biggest Nutrition Obstacle", question: "What is the biggest obstacle to your nutrition plan?", value: "" },
        ]
    },
    {
        title: "Sleep & Recovery",
        fields: [
            { label: "Average Sleep Hours", question: "How many hours do you sleep on average?", value: "" },
            { label: "Sleep Consistency", question: "Are your bed and wake times consistent?", value: "" },
            { label: "Biggest Sleep Disruptor", question: "What is the single biggest thing disrupting your sleep?", value: "" },
            { label: "Daily Water Intake", question: "How much water do you drink per day?", value: "" },
            { label: "Supplements", question: "What supplements do you take or plan to take?", value: "" },
        ]
    },
    {
        title: "Fitness Mindset",
        fields: [
            { label: "Core Fitness Motivator", question: "What is the single biggest motivator for your fitness?", value: "" },
            { label: "Discipline Strategy", question: "How will you maintain consistency when motivation fades?", value: "" },
            { label: "Plateau Strategy", question: "What will you do when progress stops for weeks?", value: "" },
            { label: "Progress Tracking Method", question: "How will you track your workouts and progress?", value: "" },
        ]
    }
];

export const MASTER_PLAN_SCHEMA: ProfileSection[] = [
    {
        title: "Core Vision",
        fields: [
            { label: "Mission Statement", question: "What is your single most powerful core mission sentence?", value: "" },
            { label: "3-Year Vision", question: "Describe your ideal life in 3 years.", value: "" },
            { label: "5-Year Vision", question: "Describe your ideal life in 5 years.", value: "" },
            { label: "Anti-Vision", question: "Describe your nightmare reality if you do nothing.", value: "" }
        ]
    },
    {
        title: "Strategic Pillars",
        fields: [
            { label: "Personal Pillar", question: "What is the core goal for your personal development?", value: "" },
            { label: "Academic Pillar", question: "What is the core goal for your academic career?", value: "" },
            { label: "Financial Pillar", question: "What is the core goal for your financial life?", value: "" },
            { label: "Fitness Pillar", question: "What is the core goal for your physical health?", value: "" }
        ]
    },
    {
        title: "Q1 Plan",
        fields: [
            { label: "Q1 Primary Objective", question: "What is the single most important thing to accomplish in Q1?", value: "" },
            { label: "Q1 Key Milestone 1", question: "What is the first major milestone for Q1?", value: "" },
            { label: "Q1 Key Milestone 2", question: "What is the second major milestone for Q1?", value: "" }
        ]
    },
    {
        title: "Q2 Plan",
        fields: [
            { label: "Q2 Primary Objective", question: "What is the single most important thing to accomplish in Q2?", value: "" },
            { label: "Q2 Key Milestone 1", question: "What is the first major milestone for Q2?", value: "" },
            { label: "Q2 Key Milestone 2", question: "What is the second major milestone for Q2?", value: "" }
        ]
    },
    {
        title: "Q3 Plan",
        fields: [
            { label: "Q3 Primary Objective", question: "What is the single most important thing to accomplish in Q3?", value: "" },
            { label: "Q3 Key Milestone 1", question: "What is the first major milestone for Q3?", value: "" },
            { label: "Q3 Key Milestone 2", question: "What is the second major milestone for Q3?", value: "" }
        ]
    },
    {
        title: "Q4 Plan",
        fields: [
            { label: "Q4 Primary Objective", question: "What is the single most important thing to accomplish in Q4?", value: "" },
            { label: "Q4 Key Milestone 1", question: "What is the first major milestone for Q4?", value: "" },
            { label: "Q4 Key Milestone 2", question: "What is the second major milestone for Q4?", value: "" }
        ]
    },
    {
        title: "Resources",
        fields: [
            { label: "Time Allocation", question: "What percentage of your weekly time goes to each pillar?", value: "" },
            { label: "Best Energy Allocation", question: "Where should your peak energy be directed?", value: "" },
            { label: "Skill 1 To Master", question: "What is the single most important skill to master this year?", value: "" },
            { label: "Skill 2 To Master", question: "What is the second most important skill?", value: "" },
            { label: "Skill 3 To Master", question: "What is the third most important skill?", value: "" }
        ]
    },
    {
        title: "Risk Management",
        fields: [
            { label: "Internal Saboteur", question: "What internal trait could derail your plan?", value: "" },
            { label: "External Saboteur", question: "What external factor could derail your plan?", value: "" },
            { label: "Mitigation Strategy", question: "What is your Plan B if things go off track?", value: "" },
            { label: "Circuit Breaker", question: "At what point would you pivot to a different strategy entirely?", value: "" }
        ]
    },
    {
        title: "Daily Execution",
        fields: [
            { label: "Non-Negotiable 1", question: "What is your first daily non-negotiable habit?", value: "" },
            { label: "Non-Negotiable 2", question: "What is your second daily non-negotiable?", value: "" },
            { label: "Non-Negotiable 3", question: "What is your third daily non-negotiable?", value: "" },
            { label: "Weekly Review Day", question: "What day and time do you review your week?", value: "" }
        ]
    }
];

export const STRATEGIST_PROMPT_SCHEMA: ProfileSection[] = [
    {
        title: "AI Identity",
        fields: [
            { label: "AI Name", question: "What name should the AI persona go by?", value: "" },
            { label: "AI Role", question: "In one sentence, what is the AI's primary purpose?", value: "" },
            { label: "AI Tone", question: "What tone should the AI use (e.g., Direct, Supportive, Blunt)?", value: "" }
        ]
    },
    {
        title: "Information Usage",
        fields: [
            { label: "Profile Usage", question: "How should the AI use your Personal, Academic, Financial, and Fitness profiles?", value: "" },
            { label: "North Star Directive", question: "What is the single most important principle the AI must always follow?", value: "" },
            { label: "Response Depth", question: "How detailed should the AI's responses be?", value: "" }
        ]
    },
    {
        title: "Communication Preferences",
        fields: [
            { label: "Preferred Language", question: "What language should the AI primarily communicate in?", value: "" },
            { label: "Directness Level", question: "On a scale of 1-10, how direct should the AI be?", value: "" },
            { label: "Output Format", question: "What format do you prefer (Bullet points, Tables, Paragraphs)?", value: "" }
        ]
    },
    {
        title: "Task Rules",
        fields: [
            { label: "Goal Management", question: "How should the AI handle your goals?", value: "" },
            { label: "Advice Style", question: "How should the AI analyze situations and provide advice?", value: "" },
            { label: "Correction Style", question: "How should the AI call out your mistakes or misalignment?", value: "" }
        ]
    },
    {
        title: "Boundaries",
        fields: [
            { label: "Things AI Should Never Do", question: "What should the AI never do or say?", value: "" },
            { label: "Uncertainty Behavior", question: "How should the AI behave when it is unsure of something?", value: "" }
        ]
    },
    {
        title: "Interaction Style",
        fields: [
            { label: "Check-in Frequency", question: "How often should the AI prompt you for updates?", value: "" },
            { label: "Conflict Handling", question: "How should the AI handle contradictions between your profile and your goals?", value: "" },
            { label: "Win Recognition", question: "How should the AI acknowledge your successes?", value: "" },
            { label: "Prompt Evolution", question: "How should the AI suggest improvements to this system prompt?", value: "" }
        ]
    }
];

export const CREATOR_PROMPT_SCHEMA: ProfileSection[] = [
    {
        title: "Creator Identity",
        fields: [
            { label: "AI Name", question: "What is your Creator persona's name?", value: "" },
            { label: "Creative Focus", question: "What type of creation does this persona excel at (e.g. Code, Art, Strategy, Writing)?", value: "" },
            { label: "Inspiration Style", question: "How should it inspire you (e.g. Provocative, Encouraging, Analytic)?", value: "" }
        ]
    },
    {
        title: "Creative Workflow",
        fields: [
            { label: "Brainstorming Logic", question: "How should it approach generating new ideas?", value: "" },
            { label: "Feedback Loop", question: "How should it provide critique on your work?", value: "" },
            { label: "Refinement Process", question: "How should it help you polish a rough concept into a final product?", value: "" }
        ]
    },
    {
        title: "Technical Directives",
        fields: [
            { label: "Code/Tool Usage", question: "How should it handle code snippets or tool recommendations?", value: "" },
            { label: "Knowledge Integration", question: "How should it integrate your local knowledge (Obsidian) into creative sessions?", value: "" },
            { label: "Project Management", question: "Should it help organize creative tasks into steps?", value: "" }
        ]
    }
];
