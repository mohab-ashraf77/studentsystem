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
// ==========================================
// SHARED AUTH & REGISTRATION ENGINE
// ==========================================

function getActiveStudent(db) {
  const userId = db.currentUser && db.currentUser.role === 'student'
    ? db.currentUser.id
    : 'S1001'; // Fallback for direct page testing
  return db.students.find(s => s.id === userId) || db.students[0];
}

function logoutUser() {
  const db = getDB();
  db.currentUser = null;
  saveDB(db);
  window.location.href = 'index.html';
}

function parseTimeRange(timeStr) {
  // Expected format: "10:00 - 11:30"
  const [startStr, endStr] = timeStr.split('-').map(t => t.trim());
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  return { start: toMinutes(startStr), end: toMinutes(endStr) };
}

function hasScheduleConflict(newCourse, enrolledCourses) {
  const newDays = newCourse.days.split('/').map(d => d.trim());
  const newTime = parseTimeRange(newCourse.time);

  for (const existing of enrolledCourses) {
    const existingDays = existing.days.split('/').map(d => d.trim());
    const sharesDay = newDays.some(day => existingDays.includes(day));
    if (!sharesDay) continue;

    const existingTime = parseTimeRange(existing.time);
    const overlaps = newTime.start < existingTime.end && newTime.end > existingTime.start;
    if (overlaps) return existing;
  }
  return null;
}

function registerCourse(courseId) {
  const db = getDB();
  const student = getActiveStudent(db);
  const course = db.courses.find(c => c.id === courseId);

  if (!student || !course) {
    return { ok: false, type: 'danger', message: 'Invalid student or course record.' };
  }

  // 1. Add/Drop Deadline Check
  if (db.deadlinePassed) {
    return { ok: false, type: 'danger', message: 'Registration is currently CLOSED by the administrator.' };
  }

  // 2. Administrative Hold Check
  if (student.hold) {
    return { ok: false, type: 'danger', message: 'Registration blocked: Your account has an active administrative hold.' };
  }

  // 3. Duplicate Enrollment / Waitlist Check
  if (student.registeredCourses.includes(courseId)) {
    return { ok: false, type: 'warning', message: `You are already registered for ${course.code}.` };
  }
  if (student.waitlistedCourses.includes(courseId)) {
    return { ok: false, type: 'warning', message: `You are already on the waitlist for ${course.code}.` };
  }

  // 4. Prerequisite Check
  if (course.prereq && course.prereq !== 'None' && !student.completedCourses.includes(course.prereq)) {
    return { ok: false, type: 'danger', message: `Prerequisite missing: You must complete ${course.prereq} before enrolling in ${course.code}.` };
  }

  // 5. Schedule Conflict Check (against registered + waitlisted courses)
  const activeCourses = db.courses.filter(c =>
    student.registeredCourses.includes(c.id) || student.waitlistedCourses.includes(c.id)
  );
  const conflict = hasScheduleConflict(course, activeCourses);
  if (conflict) {
    return {
      ok: false,
      type: 'danger',
      message: `Schedule conflict with ${conflict.code} (${conflict.days} ${conflict.time}).`
    };
  }

  // 6. Maximum Credit Limit Check
  const currentCredits = db.courses
    .filter(c => student.registeredCourses.includes(c.id))
    .reduce((sum, c) => sum + Number(c.credits), 0);

  if (currentCredits + Number(course.credits) > db.maxCredits) {
    return {
      ok: false,
      type: 'danger',
      message: `Credit limit exceeded: Adding ${course.code} (${course.credits} Cr) exceeds the ${db.maxCredits}-credit maximum.`
    };
  }

  // 7. Capacity Check -> Enroll OR Waitlist
  if (course.enrolled < course.capacity) {
    student.registeredCourses.push(courseId);
    course.enrolled += 1;
    saveDB(db);
    return { ok: true, type: 'success', message: `Successfully registered for ${course.code}: ${course.title}!` };
  } else {
    student.waitlistedCourses.push(courseId);
    course.waitlist.push(student.id);
    saveDB(db);
    return {
      ok: true,
      type: 'warning',
      message: `${course.code} is full. Added to waitlist (Position #${course.waitlist.length}).`
    };
  }
}