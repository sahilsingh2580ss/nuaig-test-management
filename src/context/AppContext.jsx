import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}

// ─────────────────────────────────────────────────────────────────────────────
// Column mappers  (DB snake_case → app camelCase)
// ─────────────────────────────────────────────────────────────────────────────
const toProject = (row) => ({
  id:          row.id,
  name:        row.name,
  description: row.description ?? '',
  status:      row.status      ?? 'Active',
  assignedTo:  row.assigned_to ?? '',
  createdBy:   row.created_by  ?? '',
  createdAt:   row.created_at,
  updatedAt:   row.updated_at,
  // team is not stored in Supabase — default to empty array so display
  // code that checks project.team?.length never throws
  team:        [],
})

const toTestCase = (row) => ({
  id:             row.id,
  projectId:      row.project_id,
  title:          row.title          ?? '',
  description:    row.description    ?? '',
  priority:       row.priority       ?? 'Medium',
  status:         row.status         ?? 'Not Run',
  type:           row.type           ?? '',
  steps:          row.steps          ?? [],
  expectedResult: row.expected_result ?? '',
  assignedTo:     row.assigned_to    ?? '',
  createdBy:      row.created_by     ?? '',
  createdAt:      row.created_at,
  updatedAt:      row.updated_at,
  executedBy:     row.executed_by    ?? null,
  executedDate:   row.executed_date  ?? null,
})

const toDefect = (row) => ({
  id:               row.id,
  projectId:        row.project_id,
  title:            row.title             ?? '',
  description:      row.description       ?? '',
  severity:         row.severity          ?? 'Medium',
  priority:         row.priority          ?? 'Medium',
  type:             row.type              ?? 'Bug',
  status:           row.status            ?? 'Open',
  assignedTo:       row.assigned_to       ?? '',
  reportedBy:       row.reported_by       ?? '',
  reportedDate:     row.reported_date     ?? null,
  stepsToReproduce: row.steps_to_reproduce ?? [],
  expectedBehavior: row.expected_behavior ?? '',
  actualBehavior:   row.actual_behavior   ?? '',
  environment:      row.environment       ?? 'Production',
  browser:          row.browser           ?? '',
  resolvedDate:     row.resolved_date     ?? null,
  createdAt:        row.created_at,
  updatedAt:        row.updated_at,
})

const toSuite = (row) => ({
  id:        row.id,
  name:      row.name,
  projectId: row.project_id,
  startDate: row.start_date ?? '',
  endDate:   row.end_date   ?? '',
  createdBy: row.created_by ?? '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  testCases: (row.suite_test_cases ?? []).map(stc => ({
    id:     stc.test_case_id,
    status: stc.status,
  })),
})

const toUser = (row) => ({
  id:          row.id,
  fullName:    row.full_name,
  firstName:   row.first_name    ?? '',
  lastName:    row.last_name     ?? '',
  username:    row.username      ?? '',
  dateOfBirth: row.date_of_birth ?? '',
  role:        row.role          ?? '',
})

// ─────────────────────────────────────────────────────────────────────────────
// Error helper — logs the full Supabase error so you can see exactly
// which column is wrong in the browser console
// ─────────────────────────────────────────────────────────────────────────────
const dbError = (label, error) => {
  console.group(`[Supabase ERROR] ${label}`)
  console.error('Message :', error.message)
  console.error('Code    :', error.code)
  console.error('Details :', error.details)
  console.error('Hint    :', error.hint)
  console.groupEnd()
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export const AppProvider = ({ children }) => {
  const [user,            setUser]            = useState(null)
  const [registeredUsers, setRegisteredUsers] = useState([])
  const [projects,        setProjects]        = useState([])
  const [testCases,       setTestCases]       = useState([])
  const [defects,         setDefects]         = useState([])
  const [testSuites,      setTestSuites]      = useState([])
  const [loading,         setLoading]         = useState(false)

  // ── Restore session ───────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('testAppUser')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  // ── Load all data once user is set ────────────────────────────────────────
  useEffect(() => {
    if (user) loadAllData()
  }, [user])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [
        { data: proj,   error: e1 },
        { data: tc,     error: e2 },
        { data: def,    error: e3 },
        { data: suites, error: e4 },
        { data: users,  error: e5 },
      ] = await Promise.all([
        supabase.from('projects')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('test_cases')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('defects')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('test_suites')
          .select('*, suite_test_cases(test_case_id, status)')
          .order('created_at', { ascending: false }),
        supabase.from('registered_users')
          .select('*')
          .order('full_name'),
      ])

      if (e1) dbError('load projects', e1)
      if (e2) dbError('load test_cases', e2)
      if (e3) dbError('load defects', e3)
      if (e4) dbError('load test_suites', e4)
      if (e5) dbError('load registered_users', e5)

      if (proj)   setProjects(proj.map(toProject))
      if (tc)     setTestCases(tc.map(toTestCase))
      if (def)    setDefects(def.map(toDefect))
      if (suites) setTestSuites(suites.map(toSuite))
      if (users)  setRegisteredUsers(users.map(toUser))
    } finally {
      setLoading(false)
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  // Sign Up — creates a new user row; returns { ok, error }
  const signUp = async ({ firstName, lastName, username, dateOfBirth, role }) => {
    // 1. Check username is unique (case-insensitive)
    const { data: existing, error: checkErr } = await supabase
      .from('registered_users')
      .select('id')
      .ilike('username', username)
      .maybeSingle()

    if (checkErr) { dbError('signUp – username check', checkErr); return { ok: false, error: 'Something went wrong. Please try again.' } }
    if (existing)  return { ok: false, error: 'Username already taken. Please choose another.' }

    // 2. Build a stable ID from the username
    const id       = username.toLowerCase()
    const fullName = `${firstName} ${lastName}`

    const { error: insertErr } = await supabase
      .from('registered_users')
      .insert({
        id,
        full_name:     fullName,
        first_name:    firstName,
        last_name:     lastName,
        username:      username.toLowerCase(),
        date_of_birth: dateOfBirth || null,
        role:          role || null,
      })

    if (insertErr) {
      dbError('signUp – insert', insertErr)
      return { ok: false, error: insertErr.message }
    }

    // 3. Update local registeredUsers list immediately
    setRegisteredUsers(prev => [...prev, { id, fullName, firstName, lastName, username: username.toLowerCase(), dateOfBirth, role }])
    return { ok: true }
  }

  // Login — both name AND username must match the same user record
  const login = async (name, username) => {
    // Look up by username first (indexed, fast)
    const { data: found, error } = await supabase
      .from('registered_users')
      .select('*')
      .ilike('username', username.trim())
      .maybeSingle()

    if (error) { dbError('login', error); return { ok: false, error: 'Something went wrong. Please try again.' } }

    // No user with that username, or the full_name doesn't match the entered name
    const nameMatches = found && found.full_name.toLowerCase() === name.trim().toLowerCase()
    if (!found || !nameMatches) {
      return { ok: false, error: 'Invalid name or username.' }
    }

    const userData = {
      id:          found.id,
      firstName:   found.first_name    ?? '',
      lastName:    found.last_name     ?? '',
      fullName:    found.full_name,
      username:    found.username,
      role:        found.role          ?? '',
      dateOfBirth: found.date_of_birth ?? '',
      loginTime:   new Date().toISOString(),
    }

    setUser(userData)
    localStorage.setItem('testAppUser', JSON.stringify(userData))
    return { ok: true }
  }

  const logout = () => {
    setUser(null)
    setProjects([])
    setTestCases([])
    setDefects([])
    setTestSuites([])
    localStorage.removeItem('testAppUser')
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  const addProject = async (project) => {
    // Only send columns that actually exist in your Supabase projects table.
    // If you get a 400 error, open DevTools → Console → look for
    // "[Supabase ERROR] addProject" to see exactly which column is rejected.
    const payload = {
      name:        project.name,
      description: project.description  || null,
      status:      project.status       || 'Active',
      assigned_to: project.assignedTo   || null,
      created_by:  user.fullName,
    }

    console.log('[Supabase] addProject payload →', payload)   // ← remove after debugging

    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single()

    if (error) {
      dbError('addProject', error)
      toast.error(`Failed to create project: ${error.message}`)
      return null
    }
    const mapped = toProject(data)
    setProjects(prev => [mapped, ...prev])
    return mapped
  }

  const updateProject = async (id, updates) => {
    const payload = {
      name:        updates.name,
      description: updates.description || null,
      status:      updates.status,
      assigned_to: updates.assignedTo  || null,
      updated_at:  new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) { dbError('updateProject', error); toast.error(`Failed to update project: ${error.message}`); return }
    setProjects(prev => prev.map(p => p.id === id ? toProject(data) : p))
  }

  const deleteProject = async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) { dbError('deleteProject', error); toast.error(`Failed to delete project: ${error.message}`); return }
    setProjects(prev   => prev.filter(p  => p.id !== id))
    setTestCases(prev  => prev.filter(tc => tc.projectId !== id))
    setDefects(prev    => prev.filter(d  => d.projectId  !== id))
    setTestSuites(prev => prev.filter(s  => s.projectId  !== id))
  }

  // ── Test Cases ────────────────────────────────────────────────────────────
  const addTestCase = async (testCase) => {
    const executed = ['Passed', 'Failed'].includes(testCase.status)
    const payload = {
      project_id:      testCase.projectId,
      title:           testCase.title           || null,
      description:     testCase.description,
      priority:        testCase.priority        || 'Medium',
      status:          testCase.status          || 'Not Run',
      type:            testCase.type            || null,
      steps:           testCase.steps           || [],
      expected_result: testCase.expectedResult  || null,
      assigned_to:     testCase.assignedTo      || null,
      created_by:      user.fullName,
      executed_by:     executed ? user.fullName : null,
      executed_date:   executed ? new Date().toISOString() : null,
    }
    const { data, error } = await supabase
      .from('test_cases')
      .insert(payload)
      .select()
      .single()
    if (error) { dbError('addTestCase', error); toast.error(`Failed to create test case: ${error.message}`); return null }
    const mapped = toTestCase(data)
    setTestCases(prev => [mapped, ...prev])
    return mapped
  }

  const updateTestCase = async (id, updates) => {
    const payload = {
      title:           updates.title           || null,
      description:     updates.description,
      priority:        updates.priority,
      status:          updates.status,
      type:            updates.type            || null,
      steps:           updates.steps           || [],
      expected_result: updates.expectedResult  || null,
      assigned_to:     updates.assignedTo      || null,
      updated_at:      new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('test_cases')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) { dbError('updateTestCase', error); toast.error(`Failed to update test case: ${error.message}`); return }
    setTestCases(prev => prev.map(tc => tc.id === id ? toTestCase(data) : tc))
  }

  const deleteTestCase = async (id) => {
    const { error } = await supabase.from('test_cases').delete().eq('id', id)
    if (error) { dbError('deleteTestCase', error); toast.error(`Failed to delete test case: ${error.message}`); return }
    setTestCases(prev  => prev.filter(tc => tc.id !== id))
    setTestSuites(prev => prev.map(s => ({
      ...s, testCases: s.testCases.filter(t => t.id !== id),
    })))
  }

  // ── Defects ───────────────────────────────────────────────────────────────
  const addDefect = async (defect) => {
    const payload = {
      project_id:         defect.projectId,
      title:              defect.title,
      description:        defect.description       || null,
      severity:           defect.severity           || 'Medium',
      priority:           defect.priority           || 'Medium',
      type:               defect.type               || 'Bug',
      status:             'Open',
      assigned_to:        defect.assignedTo         || null,
      reported_by:        user.fullName,
      steps_to_reproduce: defect.stepsToReproduce   || [],
      expected_behavior:  defect.expectedBehavior   || null,
      actual_behavior:    defect.actualBehavior      || null,
      environment:        defect.environment         || 'Production',
      browser:            defect.browser             || null,
    }
    const { data, error } = await supabase
      .from('defects')
      .insert(payload)
      .select()
      .single()
    if (error) { dbError('addDefect', error); toast.error(`Failed to report defect: ${error.message}`); return null }
    const mapped = toDefect(data)
    setDefects(prev => [mapped, ...prev])
    return mapped
  }

  const updateDefect = async (id, updates) => {
    const payload = {
      title:              updates.title,
      description:        updates.description       || null,
      severity:           updates.severity,
      priority:           updates.priority,
      type:               updates.type              || null,
      status:             updates.status,
      assigned_to:        updates.assignedTo        || null,
      steps_to_reproduce: updates.stepsToReproduce  || [],
      expected_behavior:  updates.expectedBehavior  || null,
      actual_behavior:    updates.actualBehavior     || null,
      environment:        updates.environment,
      browser:            updates.browser            || null,
      resolved_date:      updates.status === 'Resolved' ? new Date().toISOString() : null,
      updated_at:         new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('defects')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) { dbError('updateDefect', error); toast.error(`Failed to update defect: ${error.message}`); return }
    setDefects(prev => prev.map(d => d.id === id ? toDefect(data) : d))
  }

  const deleteDefect = async (id) => {
    const { error } = await supabase.from('defects').delete().eq('id', id)
    if (error) { dbError('deleteDefect', error); toast.error(`Failed to delete defect: ${error.message}`); return }
    setDefects(prev => prev.filter(d => d.id !== id))
  }

  // ── Test Suites ───────────────────────────────────────────────────────────
  const addTestSuite = async (suite) => {
    const payload = {
      name:       suite.name,
      project_id: suite.projectId,
      start_date: suite.startDate || null,
      end_date:   suite.endDate   || null,
      created_by: user.fullName,
    }
    const { data, error } = await supabase
      .from('test_suites')
      .insert(payload)
      .select('*, suite_test_cases(test_case_id, status)')
      .single()
    if (error) { dbError('addTestSuite', error); toast.error(`Failed to create test suite: ${error.message}`); return null }
    const mapped = toSuite(data)
    setTestSuites(prev => [mapped, ...prev])
    return mapped
  }

  const updateTestSuite = async (id, updates) => {
    const payload = {
      name:       updates.name,
      start_date: updates.startDate || null,
      end_date:   updates.endDate   || null,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('test_suites')
      .update(payload)
      .eq('id', id)
      .select('*, suite_test_cases(test_case_id, status)')
      .single()
    if (error) { dbError('updateTestSuite', error); toast.error(`Failed to update test suite: ${error.message}`); return }
    setTestSuites(prev => prev.map(s => s.id === id ? toSuite(data) : s))
  }

  const deleteTestSuite = async (id) => {
    const { error } = await supabase.from('test_suites').delete().eq('id', id)
    if (error) { dbError('deleteTestSuite', error); toast.error(`Failed to delete test suite: ${error.message}`); return }
    setTestSuites(prev => prev.filter(s => s.id !== id))
  }

  const addTestCasesToSuite = async (suiteId, tcIds) => {
    const rows = tcIds.map(tcId => ({
      suite_id:     suiteId,
      test_case_id: tcId,
      status:       'Not Run',
    }))
    const { error } = await supabase
      .from('suite_test_cases')
      .upsert(rows, { onConflict: 'suite_id,test_case_id', ignoreDuplicates: true })
    if (error) { dbError('addTestCasesToSuite', error); toast.error(`Failed to add test cases: ${error.message}`); return }

    const { data, error: e2 } = await supabase
      .from('test_suites')
      .select('*, suite_test_cases(test_case_id, status)')
      .eq('id', suiteId)
      .single()
    if (e2) { dbError('reload suite after addTestCases', e2); return }
    setTestSuites(prev => prev.map(s => s.id === suiteId ? toSuite(data) : s))
  }

  const updateSuiteTestCaseStatus = async (suiteId, tcId, status) => {
    const { error } = await supabase
      .from('suite_test_cases')
      .update({ status })
      .eq('suite_id', suiteId)
      .eq('test_case_id', tcId)
    if (error) { dbError('updateSuiteTestCaseStatus', error); toast.error(`Failed to update status: ${error.message}`); return }
    // Optimistic local update
    setTestSuites(prev => prev.map(s => {
      if (s.id !== suiteId) return s
      return { ...s, testCases: s.testCases.map(t => t.id === tcId ? { ...t, status } : t) }
    }))
  }

  const removeTestCaseFromSuite = async (suiteId, tcId) => {
    const { error } = await supabase
      .from('suite_test_cases')
      .delete()
      .eq('suite_id', suiteId)
      .eq('test_case_id', tcId)
    if (error) { dbError('removeTestCaseFromSuite', error); toast.error(`Failed to remove test case: ${error.message}`); return }
    setTestSuites(prev => prev.map(s => {
      if (s.id !== suiteId) return s
      return { ...s, testCases: s.testCases.filter(t => t.id !== tcId) }
    }))
  }

  // ── Lookups ───────────────────────────────────────────────────────────────
  const getProjectById  = (id) => projects.find(p  => p.id  === parseInt(id))
  const getTestCaseById = (id) => testCases.find(tc => tc.id === parseInt(id))
  const getDefectById   = (id) => defects.find(d   => d.id  === parseInt(id))

  const getProjectStats = (projectId) => {
    const pts = testCases.filter(tc => tc.projectId === projectId)
    const pd  = defects.filter(d    => d.projectId  === projectId)
    return {
      totalTestCases:   pts.length,
      passedTestCases:  pts.filter(tc => tc.status === 'Passed').length,
      failedTestCases:  pts.filter(tc => tc.status === 'Failed').length,
      pendingTestCases: pts.filter(tc => !['Passed','Failed'].includes(tc.status)).length,
      totalDefects:     pd.length,
      openDefects:      pd.filter(d => d.status   === 'Open').length,
      resolvedDefects:  pd.filter(d => d.status   === 'Resolved').length,
      criticalDefects:  pd.filter(d => d.severity === 'Critical').length,
    }
  }

  const getOverallStats = () => ({
    totalProjects:   projects.length,
    activeProjects:  projects.filter(p  => p.status   === 'Active').length,
    totalTestCases:  testCases.length,
    passedTestCases: testCases.filter(tc => tc.status === 'Passed').length,
    failedTestCases: testCases.filter(tc => tc.status === 'Failed').length,
    totalDefects:    defects.length,
    openDefects:     defects.filter(d => d.status    === 'Open').length,
    criticalDefects: defects.filter(d => d.severity  === 'Critical').length,
  })

  const value = {
    user, registeredUsers, loading,
    projects, testCases, defects, testSuites,
    login, logout, signUp,
    addProject, updateProject, deleteProject, getProjectById,
    addTestCase, updateTestCase, deleteTestCase, getTestCaseById,
    addDefect, updateDefect, deleteDefect, getDefectById,
    addTestSuite, updateTestSuite, deleteTestSuite,
    addTestCasesToSuite, updateSuiteTestCaseStatus, removeTestCaseFromSuite,
    getProjectStats, getOverallStats,
    loadAllData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export default AppContext
