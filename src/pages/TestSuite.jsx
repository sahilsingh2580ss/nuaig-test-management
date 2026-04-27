import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Filter, ArrowLeft, Edit2, Trash2,
  CheckCircle2, XCircle, Clock3, FlaskConical,
  ChevronRight, FolderOpen, CalendarDays, X,
  FileText, ListChecks, Target, Tag,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'

// ─── Helpers ────────────────────────────────────────────────────────────────
const priorityBadge = p =>
  ({ Critical:'badge-error', High:'badge-warning', Medium:'badge-info', Low:'badge-grey' }[p] ?? 'badge-grey')

const statusPill = s =>
  ({ Passed:'bg-green-100 text-green-700', Failed:'bg-red-100 text-red-700' }[s] ?? 'bg-gray-100 text-gray-600')

const tcStatusBadge = s =>
  ({ Passed:'badge-success', Failed:'badge-error', 'Not Run':'badge-grey' }[s] ?? 'badge-grey')

const fmt = d =>
  d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'

// ─── Read-Only Test Case Detail Panel ────────────────────────────────────────
const TestCaseReadOnly = ({ testCase, suiteStatus, onClose }) => {
  if (!testCase) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col z-10">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Test Case Details</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 scrollbar-thin">

          {/* Title / Description */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
              <FileText className="w-3.5 h-3.5" /> Description
            </div>
            <p className="text-gray-900 font-medium">{testCase.title || testCase.description}</p>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <span className={`badge ${priorityBadge(testCase.priority)}`}>{testCase.priority} Priority</span>
            <span className={`badge ${tcStatusBadge(testCase.status)}`}>{testCase.status}</span>
            {testCase.type && <span className="badge badge-grey">{testCase.type}</span>}
            {suiteStatus && (
              <span className={`badge ${tcStatusBadge(suiteStatus)}`}>Suite: {suiteStatus}</span>
            )}
          </div>

          {/* Test Steps */}
          {testCase.steps && testCase.steps.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                <ListChecks className="w-3.5 h-3.5" /> Test Steps
              </div>
              <ol className="space-y-1.5 list-decimal list-inside">
                {testCase.steps.map((step, i) => (
                  <li key={i} className="text-sm text-gray-800">{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Expected Result */}
          {testCase.expectedResult && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                <Target className="w-3.5 h-3.5" /> Expected Result
              </div>
              <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 border border-gray-200">
                {testCase.expectedResult}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            {testCase.createdBy && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Created by</p>
                <p className="text-sm font-medium text-gray-700">{testCase.createdBy}</p>
              </div>
            )}
            {testCase.createdAt && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Created on</p>
                <p className="text-sm font-medium text-gray-700">{fmt(testCase.createdAt)}</p>
              </div>
            )}
            {testCase.assignedTo && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Assigned to</p>
                <p className="text-sm font-medium text-gray-700">{testCase.assignedTo}</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer — read-only notice */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-xl flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">View only — editing is not available from this screen</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Detail View ─────────────────────────────────────────────────────────────
const SuiteDetail = ({ suiteId, onBack }) => {
  const {
    testSuites, projects, testCases,
    updateTestSuite, deleteTestSuite,
    addTestCasesToSuite, updateSuiteTestCaseStatus, removeTestCaseFromSuite,
  } = useApp()

  const suite   = testSuites.find(s => s.id === suiteId)
  if (!suite) { onBack(); return null }

  const project          = projects.find(p => p.id === suite.projectId)
  const projectTestCases = testCases.filter(tc => tc.projectId === suite.projectId)
  const entries          = suite.testCases || []
  const entryIds         = new Set(entries.map(e => e.id))

  const total  = entries.length
  const passed = entries.filter(e => e.status === 'Passed').length
  const failed = entries.filter(e => e.status === 'Failed').length
  const notRun = entries.filter(e => e.status === 'Not Run').length
  const pct    = total > 0 ? Math.round((passed / total) * 100) : 0

  // Edit suite
  const [showEdit,   setShowEdit]   = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [editForm,   setEditForm]   = useState({
    name: suite.name, startDate: suite.startDate || '', endDate: suite.endDate || '',
  })

  // Add test-cases
  const [showAddTC,   setShowAddTC]   = useState(false)
  const [tcSearch,    setTcSearch]    = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  // View test-case (read-only)
  const [viewingTc,     setViewingTc]     = useState(null)
  const [viewingSuiteStatus, setViewingSuiteStatus] = useState(null)

  const available = projectTestCases.filter(tc =>
    !entryIds.has(tc.id) &&
    (tc.title || tc.description || '').toLowerCase().includes(tcSearch.toLowerCase())
  )

  const toggleId = id =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const handleEditSubmit = e => {
    e.preventDefault()
    if (!editForm.name.trim()) { toast.error('Suite name is required'); return }
    updateTestSuite(suite.id, editForm)
    toast.success('Test suite updated!')
    setShowEdit(false)
  }

  const handleAddTC = () => {
    if (!selectedIds.length) { toast.error('Select at least one test case'); return }
    addTestCasesToSuite(suite.id, selectedIds)
    toast.success(`${selectedIds.length} test case(s) added!`)
    setShowAddTC(false); setSelectedIds([]); setTcSearch('')
  }

  const handleDelete = () => {
    deleteTestSuite(suite.id)
    toast.success('Test suite deleted!')
    onBack()
  }

  const openTcView = (entry) => {
    const tc = testCases.find(t => t.id === entry.id)
    if (!tc) return
    setViewingTc(tc)
    setViewingSuiteStatus(entry.status)
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={onBack} className="mt-1 p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 truncate">{suite.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5" />
              {project ? project.name : <span className="italic">Unknown project</span>}
            </span>
            {(suite.startDate || suite.endDate) && (
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {fmt(suite.startDate)} → {fmt(suite.endDate)}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setEditForm({ name:suite.name, startDate:suite.startDate||'', endDate:suite.endDate||'' }); setShowEdit(true) }}
            className="btn-primary flex items-center gap-1.5 text-sm py-2">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowDelete(true)}
            className="btn-danger flex items-center gap-1.5 text-sm py-2">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </motion.button>
        </div>
      </div>

      {/* Summary dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'Total',   value:total,  bg:'bg-gray-50',   border:'border-gray-200',  txt:'text-gray-800',  icon:<FlaskConical  className="w-5 h-5 text-gray-500"  /> },
          { label:'Passed',  value:passed, bg:'bg-green-50',  border:'border-green-200', txt:'text-green-700', icon:<CheckCircle2  className="w-5 h-5 text-green-500" /> },
          { label:'Failed',  value:failed, bg:'bg-red-50',    border:'border-red-200',   txt:'text-red-700',   icon:<XCircle       className="w-5 h-5 text-red-500"   /> },
          { label:'Not Run', value:notRun, bg:'bg-slate-50',  border:'border-slate-200', txt:'text-slate-600', icon:<Clock3        className="w-5 h-5 text-slate-400" /> },
        ].map(({ label, value, bg, border, txt, icon }) => (
          <motion.div key={label} whileHover={{ y: -2 }}
            className={`${bg} border ${border} rounded-xl p-4 flex items-center gap-3`}>
            <div className="flex-shrink-0">{icon}</div>
            <div>
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <p className={`text-2xl font-bold ${txt}`}>{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Progress</span>
            <span className="font-semibold text-gray-700">{pct}% passed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden flex">
            <div className="bg-green-500 h-full transition-all duration-700" style={{ width:`${(passed/total)*100}%` }} />
            <div className="bg-red-500  h-full transition-all duration-700" style={{ width:`${(failed/total)*100}%` }} />
          </div>
        </div>
      )}

      {/* Test Cases table */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Test Cases</h3>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setSelectedIds([]); setTcSearch(''); setShowAddTC(true) }}
            className="btn-primary flex items-center gap-2 text-sm py-2">
            <Plus className="w-4 h-4" /> Add Test Case
          </motion.button>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <FlaskConical className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No test cases yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Test Case" to populate this suite</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-8">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Description</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Priority</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-44">Status</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => {
                  const tc = testCases.find(t => t.id === entry.id)
                  if (!tc) return null
                  return (
                    <motion.tr key={entry.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-t border-gray-100 hover:bg-blue-50/40 transition-colors group">

                      {/* Row number — clicking opens read-only view */}
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{idx + 1}</td>

                      {/* Description — clickable */}
                      <td
                        className="px-4 py-3 text-gray-900 font-medium max-w-xs cursor-pointer"
                        onClick={() => openTcView(entry)}
                        title="Click to view details">
                        <span className="line-clamp-2 group-hover:text-primary transition-colors underline-offset-2 hover:underline">
                          {tc.title || tc.description}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`badge ${priorityBadge(tc.priority)}`}>{tc.priority}</span>
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={entry.status}
                          onChange={e => updateSuiteTestCaseStatus(suite.id, entry.id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className={`text-xs font-semibold rounded-full px-3 py-1.5 border-0 cursor-pointer
                            focus:outline-none focus:ring-2 focus:ring-primary appearance-none
                            ${statusPill(entry.status)}`}>
                          <option value="Not Run">Not Run</option>
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); removeTestCaseFromSuite(suite.id, entry.id); toast.success('Removed') }}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition-colors"
                          title="Remove from suite">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Suite Modal ── */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Test Suite">
        <form onSubmit={handleEditSubmit} className="flex flex-col max-h-[60vh]">
          <div className="overflow-y-auto pr-1 space-y-4 flex-1 scrollbar-thin">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Suite Name *</label>
              <input type="text" value={editForm.name}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                className="input-field" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input type="date" value={editForm.startDate}
                  onChange={e => setEditForm(p => ({ ...p, startDate: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input type="date" value={editForm.endDate}
                  onChange={e => setEditForm(p => ({ ...p, endDate: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
              <input type="text" value={project ? project.name : ''} disabled
                className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
          </div>
          <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100 bg-white flex-shrink-0">
            <button type="button" onClick={() => setShowEdit(false)} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Update Suite</button>
          </div>
        </form>
      </Modal>

      {/* ── Add Test Cases Modal ── */}
      <Modal isOpen={showAddTC} onClose={() => setShowAddTC(false)} title="Add Test Cases to Suite">
        <div className="flex flex-col max-h-[65vh]">
          <div className="relative mb-3 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search test cases…" value={tcSearch}
              onChange={e => setTcSearch(e.target.value)} className="input-field pl-9" />
          </div>
          {selectedIds.length > 0 && (
            <p className="text-xs font-medium text-primary mb-2 flex-shrink-0">{selectedIds.length} selected</p>
          )}
          <div className="overflow-y-auto flex-1 scrollbar-thin space-y-2 pr-1">
            {available.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                {projectTestCases.length === 0
                  ? 'No test cases exist for this project yet'
                  : 'All test cases already added or none match search'}
              </div>
            ) : (
              available.map(tc => (
                <label key={tc.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${selectedIds.includes(tc.id) ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={selectedIds.includes(tc.id)} onChange={() => toggleId(tc.id)}
                    className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{tc.title || tc.description}</p>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      <span className={`badge text-xs ${priorityBadge(tc.priority)}`}>{tc.priority}</span>
                      <span className={`badge text-xs ${tcStatusBadge(tc.status)}`}>{tc.status}</span>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
          <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100 bg-white flex-shrink-0">
            <button type="button" onClick={() => setShowAddTC(false)} className="btn-outline flex-1">Cancel</button>
            <button type="button" onClick={handleAddTC} disabled={!selectedIds.length}
              className={`flex-1 btn-primary ${!selectedIds.length ? 'opacity-50 cursor-not-allowed' : ''}`}>
              Add{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''} Selected
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Read-Only Test Case View ── */}
      <AnimatePresence>
        {viewingTc && (
          <TestCaseReadOnly
            testCase={viewingTc}
            suiteStatus={viewingSuiteStatus}
            onClose={() => { setViewingTc(null); setViewingSuiteStatus(null) }}
          />
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={handleDelete} title="Delete Test Suite"
        message="Are you sure you want to delete this test suite? This action cannot be undone."
        confirmText="Delete" confirmButtonClass="btn-danger" />
    </div>
  )
}

// ─── List View ────────────────────────────────────────────────────────────────
const EMPTY_SUITE_FORM = { name: '', startDate: '', endDate: '', projectId: '' }

const TestSuite = () => {
  const { testSuites, addTestSuite, projects } = useApp()

  const [activeSuiteId, setActiveSuiteId] = useState(null)
  const [showCreate,    setShowCreate]    = useState(false)
  const [searchTerm,    setSearchTerm]    = useState('')
  const [projectFilter, setProjectFilter] = useState('All')
  const [formData,      setFormData]      = useState(EMPTY_SUITE_FORM)

  const resetAndCloseCreate = () => {
    setFormData(EMPTY_SUITE_FORM)
    setShowCreate(false)
  }

  if (activeSuiteId !== null) {
    return <SuiteDetail suiteId={activeSuiteId} onBack={() => setActiveSuiteId(null)} />
  }

  const filtered = testSuites.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (projectFilter === 'All' || s.projectId === parseInt(projectFilter))
  )

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleCreate = e => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.projectId) {
      toast.error('Suite name and project are required'); return
    }
    const suite = addTestSuite({ ...formData, projectId: parseInt(formData.projectId) })
    toast.success('Test suite created!')
    setShowCreate(false)
    setFormData(EMPTY_SUITE_FORM)
    setActiveSuiteId(suite.id)
  }

  return (
    <div className="space-y-6">

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search test suites…"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field pl-10 w-full" />
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Suite
        </motion.button>
      </div>

      {/* Project filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Project:</span>
        </div>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="input-field py-1.5 text-sm w-auto">
          <option value="All">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Cards / empty state */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FlaskConical className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-semibold">No test suites available</p>
            <p className="text-gray-400 text-sm mt-1">
              {testSuites.length === 0 ? 'Create your first suite to organise test cases' : 'No suites match your current filters'}
            </p>
            {testSuites.length === 0 && (
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={() => setShowCreate(true)} className="btn-primary mt-5 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Test Suite
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div key="grid" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((suite, i) => {
              const proj    = projects.find(p => p.id === suite.projectId)
              const entries = suite.testCases || []
              const total   = entries.length
              const passed  = entries.filter(e => e.status === 'Passed').length
              const failed  = entries.filter(e => e.status === 'Failed').length
              const notRun  = entries.filter(e => e.status === 'Not Run').length
              const pct     = total > 0 ? Math.round((passed / total) * 100) : 0

              return (
                <motion.div key={suite.id}
                  initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.06 }}
                  onClick={() => setActiveSuiteId(suite.id)}
                  className="card cursor-pointer group hover:shadow-md hover:border-primary/40 transition-all duration-200">

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FlaskConical className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">{suite.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{proj ? proj.name : '—'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </div>

                  {(suite.startDate || suite.endDate) && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {fmt(suite.startDate)} → {fmt(suite.endDate)}
                    </div>
                  )}

                  <div className="flex gap-2 mb-3 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">
                      <CheckCircle2 className="w-3 h-3" />{passed} Passed
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-red-50 text-red-700 rounded-full font-medium">
                      <XCircle className="w-3 h-3" />{failed} Failed
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                      <Clock3 className="w-3 h-3" />{notRun} Not Run
                    </span>
                  </div>

                  {total > 0 ? (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden flex">
                        <div className="bg-green-500 h-full" style={{ width:`${(passed/total)*100}%` }} />
                        <div className="bg-red-500  h-full" style={{ width:`${(failed/total)*100}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">{total} test case{total !== 1 ? 's' : ''} · {pct}% pass rate</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No test cases added yet</p>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Suite Modal */}
      <Modal isOpen={showCreate} onClose={resetAndCloseCreate} title="Add Test Suite">
        <form onSubmit={handleCreate} className="flex flex-col max-h-[65vh]">
          <div className="overflow-y-auto pr-1 space-y-4 flex-1 scrollbar-thin">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Suite Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                className="input-field" placeholder="e.g. Regression Suite v2.0" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
              <select name="projectId" value={formData.projectId} onChange={handleChange} className="input-field" required>
                <option value="">— Select a project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100 bg-white flex-shrink-0">
            <button type="button" onClick={resetAndCloseCreate} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create Suite</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default TestSuite
