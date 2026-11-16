const STORAGE_KEY = "coursereg_db_v1";

const DEFAULT_DB = {
  deadlinePassed: false,
  minCredits: 12,
  maxCredits: 18,
  currentUser: null, // { id, name, email, role: "student" | "admin" }
  students: [
    {
      id: "S1001",
      name: "Alex Morgan",
      email: "alex@university.edu",
      password: "password123",
      hold: false,
      completedCourses: ["CS101", "MATH101"],
      registeredCourses: ["CS201"],
      waitlistedCourses: []
    },
    {
      id: "S1002",
      name: "Sara Jenkins",
      email: "sara@university.edu",
      password: "password123",
      hold: true, // Active academic/financial hold demo
      completedCourses: ["CS101"],
      registeredCourses: [],
      waitlistedCourses: []
    }
  ],
  admins: [
    {
      id: "A01",
      name: "Dr. Robert Vance",
      email: "admin@university.edu",
      password: "admin123"
    }
  ],
  courses: [
    {
      id: "CS201",
      code: "CS 201",
      title: "Data Structures & Algorithms",
      department: "Computer Science",
      instructor: "Dr. Alan Turing",
      credits: 4,
      days: "Mon / Wed",
      time: "10:00 - 11:30",
      capacity: 30,
      enrolled: 24,
      prereq: "CS101",
      waitlist: [],
      description: "Arrays, linked lists, stacks, queues, trees, graphs, and algorithm complexity analysis."
    },
    {
      id: "CS205",
      code: "CS 205",
      title: "Database Management Systems",
      department: "Computer Science",
      instructor: "Prof. Grace Hopper",
      credits: 3,
      days: "Tue / Thu",
      time: "12:00 - 13:30",
      capacity: 25,
      enrolled: 25, // Full course for waitlist testing
      prereq: "CS101",
      waitlist: [],
      description: "Relational modeling, ER diagrams, SQL, normalization, and transaction management."
    },
    {
      id: "CS302",
      code: "CS 302",
      title: "Operating Systems",
      department: "Computer Science",
      instructor: "Dr. Linus Torvalds",
      credits: 4,
      days: "Mon / Wed",
      time: "10:00 - 11:30", // Intentional schedule conflict with CS201
      capacity: 30,
      enrolled: 18,
      prereq: "CS201", // Prerequisite check demo
      waitlist: [],
      description: "Processes, threads, CPU scheduling, memory management, and file systems."
    },
    {
      id: "MATH202",
      code: "MATH 202",
      title: "Linear Algebra",
      department: "Mathematics",
      instructor: "Dr. Katherine Johnson",
      credits: 3,
      days: "Tue / Thu",
      time: "09:00 - 10:30",
      capacity: 40,
      enrolled: 31,
      prereq: "MATH101",
      waitlist: [],
      description: "Vector spaces, matrices, eigenvalues, eigenvectors, and linear transformations."
    }
  ]
};
function getDB() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DB));
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
  return JSON.parse(raw);
}

function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function resetDB() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DB));
  window.location.reload();
}