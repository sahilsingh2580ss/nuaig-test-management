import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Edit, Trash2, Users, FileText,
  Plus, UserCircle, Info, Download,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import StatCard from '../components/StatCard'
import toast from 'react-hot-toast'

// ── badge helpers ────────────────────────────────────────────────────────────
const statusBadge   = s => ({ Active:'badge-success', Completed:'badge-primary', 'On Hold':'badge-warning' }[s] ?? 'badge-grey')
const tcStatusBadge = s => ({ Passed:'badge-success', Failed:'badge-error', 'Not Run':'badge-grey' }[s] ?? 'badge-grey')
const priorityBadge = p => ({ Critical:'badge-error', High:'badge-warning', Medium:'badge-info' }[p] ?? 'badge-grey')

const ProjectDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    getProjectById, updateProject, deleteProject,
    getProjectStats, testCases, addTestCase, updateTestCase, deleteTestCase,
    registeredUsers,
  } = useApp()

  const project = getProjectById(id)

  const [showEditModal,            setShowEditModal]            = useState(false)
  const [showDeleteDialog,         setShowDeleteDialog]         = useState(false)
  const [formData,                 setFormData]                 = useState(project || {})
  const [showTestCaseModal,        setShowTestCaseModal]        = useState(false)
  const [showDetailModal,          setShowDetailModal]          = useState(false)
  const [showTestCaseDeleteDialog, setShowTestCaseDeleteDialog] = useState(false)
  const [selectedTestCase,         setSelectedTestCase]         = useState(null)
  const [testCaseToDelete,         setTestCaseToDelete]         = useState(null)
  const [editingTestCase,          setEditingTestCase]          = useState(false)
  const [testCaseFormData,         setTestCaseFormData]         = useState({
    description: '', steps: '', expectedResult: '', priority: 'Medium', status: 'Not Run',
  })

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Project not found</p>
        <button onClick={() => navigate('/projects')} className="btn-primary mt-4">
          Back to Projects
        </button>
      </div>
    )
  }

  const stats            = getProjectStats(project.id)
  const projectTestCases = testCases.filter(tc => tc.projectId === project.id)

  // Only show Developer and QA users in Assigned To dropdown
  const userOptions = registeredUsers
    .filter(u => ['Developer', 'QA'].includes(u.role))
    .map(u => u.fullName)

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleUpdate = (e) => {
    e.preventDefault()
    updateProject(project.id, formData)
    toast.success('Project updated successfully!')
    setShowEditModal(false)
  }

  const handleDelete = () => {
    deleteProject(project.id)
    toast.success('Project deleted successfully!')
    navigate('/projects')
  }

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleTestCaseSubmit = (e) => {
    e.preventDefault()
    const { description, steps, expectedResult } = testCaseFormData
    if (!description.trim() || !steps.trim() || !expectedResult.trim()) {
      toast.error('Description, steps, and expected result are required'); return
    }
    const stepsArray = steps.split('\n').filter(s => s.trim())
    if (editingTestCase) {
      updateTestCase(selectedTestCase.id, { ...testCaseFormData, steps: stepsArray })
      toast.success('Test case updated successfully!')
    } else {
      addTestCase({ ...testCaseFormData, projectId: project.id, steps: stepsArray })
      toast.success('Test case created successfully!')
    }
    setShowTestCaseModal(false)
    setEditingTestCase(false)
    setTestCaseFormData({ description:'', steps:'', expectedResult:'', priority:'Medium', status:'Not Run' })
  }

  const handleTestCaseChange = (e) =>
    setTestCaseFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleViewTestCase = (tc) => { setSelectedTestCase(tc); setShowDetailModal(true) }

  const handleEditTestCase = () => {
    setTestCaseFormData({
      description:    selectedTestCase.description    || '',
      steps:          Array.isArray(selectedTestCase.steps) ? selectedTestCase.steps.join('\n') : selectedTestCase.steps || '',
      expectedResult: selectedTestCase.expectedResult || '',
      priority:       selectedTestCase.priority       || 'Medium',
      status:         selectedTestCase.status         || 'Not Run',
    })
    setEditingTestCase(true)
    setShowDetailModal(false)
    setShowTestCaseModal(true)
  }

  const handleDeleteTestCase = () => {
    deleteTestCase(testCaseToDelete.id)
    toast.success('Test case deleted successfully!')
    setShowTestCaseDeleteDialog(false)
    setShowDetailModal(false)
    setTestCaseToDelete(null)
  }

  // ── CSV Export ────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (projectTestCases.length === 0) {
      toast.error('No test cases to export for this project.')
      return
    }

    // Wrap a cell value in quotes and escape any internal quotes
    const escape = (val) => {
      const str = (val ?? '').toString().replace(/"/g, '""')
      return `"${str}"`
    }

    const headers = [
      'Project Name',
      'Test Description',
      'Test Steps',
      'Expected Result',
      'Priority',
      'Status',
    ]

    const rows = projectTestCases.map(tc => {
      // Steps can be an array — join with " | " so each step is readable in one cell
      const steps = Array.isArray(tc.steps)
        ? tc.steps.join(' | ')
        : (tc.steps ?? '')

      return [
        escape(project.name),
        escape(tc.title || tc.description),
        escape(steps),
        escape(tc.expectedResult),
        escape(tc.priority),
        escape(tc.status),
      ].join(',')
    })

    const csv     = [headers.join(','), ...rows].join('\n')
    const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url     = URL.createObjectURL(blob)
    const link    = document.createElement('a')
    const filename = `${project.name.replace(/\s+/g, '_')}_test_cases.csv`

    link.href     = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Exported ${projectTestCases.length} test case(s) to ${filename}`)
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900 flex-1 min-w-0 truncate">{project.name}</h1>
        <span className={`badge ${statusBadge(project.status)}`}>{project.status}</span>
      </div>

      {/* ── Stat rows ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Test Cases" value={stats.totalTestCases} color="primary" />
        <StatCard title="Passed"           value={stats.passedTestCases}  color="success" />
        <StatCard title="Failed"           value={stats.failedTestCases}  color="danger"  />
        <StatCard title="Pending"          value={stats.pendingTestCases} color="warning" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Defects" value={stats.totalDefects}    color="info"    />
        <StatCard title="Open"          value={stats.openDefects}     color="danger"  />
        <StatCard title="Resolved"      value={stats.resolvedDefects} color="success" />
        <StatCard title="Critical"      value={stats.criticalDefects} color="danger"  />
      </div>

      {/* ── Project info card ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Project Information</h2>
          <div className="flex gap-2">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="btn-outline flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setFormData(project); setShowEditModal(true) }}
              className="btn-primary flex items-center gap-2">
              <Edit className="w-4 h-4" /> Edit
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowDeleteDialog(true)}
              className="btn-danger flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete
            </motion.button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="text-gray-900 mt-1">{project.description || 'No description provided'}</p>
            </div>
          </div>

          {project.assignedTo && (
            <div className="flex items-start gap-3">
              <UserCircle className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-500">Assigned To</p>
                <span className="badge badge-primary mt-1">{project.assignedTo}</span>
              </div>
            </div>
          )}

          {project.team && project.team.length > 0 && (
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-500">Team Members</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.team.map((member, i) => (
                    <span key={i} className="badge badge-primary">{member}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">Created by <span className="font-medium">{project.createdBy}</span></p>
          </div>
        </div>
      </div>

      {/* ── Test cases card ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Test Cases</h2>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingTestCase(false)
              setTestCaseFormData({ description:'', steps:'', expectedResult:'', priority:'Medium', status:'Not Run' })
              setShowTestCaseModal(true)
            }}
            className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Test Case
          </motion.button>
        </div>

        {projectTestCases.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No test cases available</p>
            <p className="text-gray-400 text-sm mt-1">Create your first test case to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Description</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {projectTestCases.map(tc => (
                  <motion.tr key={tc.id} whileHover={{ backgroundColor: '#f9fafb' }}
                    onClick={() => handleViewTestCase(tc)}
                    className="border-t border-gray-200 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">{tc.title || tc.description}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${tcStatusBadge(tc.status)}`}>{tc.status}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════ */}

      {/* ── Edit Project Modal ── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project">
        <form onSubmit={handleUpdate} className="flex flex-col max-h-[65vh]">
          <div className="overflow-y-auto pr-1 space-y-4 flex-1 scrollbar-thin">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleChange}
                className="input-field" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea name="description" value={formData.description || ''} onChange={handleChange}
                className="input-field min-h-[100px] resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select name="status" value={formData.status || 'Active'} onChange={handleChange} className="input-field">
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* ── Assigned To — all users who have logged in ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              <select name="assignedTo" value={formData.assignedTo || ''} onChange={handleChange} className="input-field">
                <option value="">— Select a user —</option>
                {userOptions.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

          </div>
          <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100 bg-white flex-shrink-0">
            <button type="button" onClick={() => setShowEditModal(false)} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Update Project</button>
          </div>
        </form>
      </Modal>

      {/* ── Add / Edit Test Case Modal ── */}
      <Modal isOpen={showTestCaseModal}
        onClose={() => { setShowTestCaseModal(false); setEditingTestCase(false) }}
        title={editingTestCase ? 'Edit Test Case' : 'Add Test Case'}>
        <form onSubmit={handleTestCaseSubmit} className="flex flex-col max-h-[65vh]">
          <div className="overflow-y-auto pr-1 space-y-4 flex-1 scrollbar-thin">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea name="description" value={testCaseFormData.description} onChange={handleTestCaseChange}
                className="input-field min-h-[80px] resize-none" placeholder="Enter test case description" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Steps * <span className="font-normal text-gray-400">(one per line)</span></label>
              <textarea name="steps" value={testCaseFormData.steps} onChange={handleTestCaseChange}
                className="input-field min-h-[120px] resize-none font-mono text-sm"
                placeholder={"Step 1: Navigate to login page\nStep 2: Enter credentials\nStep 3: Click submit"} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expected Result *</label>
              <textarea name="expectedResult" value={testCaseFormData.expectedResult} onChange={handleTestCaseChange}
                className="input-field min-h-[80px] resize-none" placeholder="Describe the expected outcome" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                <select name="priority" value={testCaseFormData.priority} onChange={handleTestCaseChange} className="input-field" required>
                  <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select name="status" value={testCaseFormData.status} onChange={handleTestCaseChange} className="input-field" required>
                  <option value="Not Run">Not Run</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>

          </div>
          <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100 bg-white flex-shrink-0">
            <button type="button" onClick={() => { setShowTestCaseModal(false); setEditingTestCase(false) }} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">{editingTestCase ? 'Update' : 'Create'} Test Case</button>
          </div>
        </form>
      </Modal>

      {/* ── Test Case Detail (view-only) Modal ── */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Test Case Details">
        {selectedTestCase && (
          <div className="flex flex-col max-h-[65vh]">
            <div className="overflow-y-auto pr-1 space-y-5 flex-1 scrollbar-thin">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Description</p>
                <p className="text-gray-900">{selectedTestCase.title || selectedTestCase.description}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Test Steps</p>
                {selectedTestCase.steps && selectedTestCase.steps.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1.5">
                    {selectedTestCase.steps.map((step, i) => (
                      <li key={i} className="text-gray-900 text-sm">{step}</li>
                    ))}
                  </ol>
                ) : <p className="text-gray-400 text-sm">No steps defined</p>}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Expected Result</p>
                <p className="text-gray-900">{selectedTestCase.expectedResult || 'Not specified'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Priority</p>
                  <span className={`badge ${priorityBadge(selectedTestCase.priority)}`}>{selectedTestCase.priority}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Status</p>
                  <span className={`badge ${tcStatusBadge(selectedTestCase.status)}`}>{selectedTestCase.status}</span>
                </div>
              </div>

            </div>

            <div className="flex gap-3 pt-4 mt-3 border-t border-gray-200 flex-shrink-0">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleEditTestCase} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Edit className="w-4 h-4" /> Edit
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { setTestCaseToDelete(selectedTestCase); setShowTestCaseDeleteDialog(true) }}
                className="btn-danger flex-1 flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </motion.button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Confirm Dialogs ── */}
      <ConfirmDialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete} title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone and will also delete all associated test cases and defects."
        confirmText="Delete" confirmButtonClass="btn-danger" />

      <ConfirmDialog isOpen={showTestCaseDeleteDialog}
        onClose={() => { setShowTestCaseDeleteDialog(false); setTestCaseToDelete(null) }}
        onConfirm={handleDeleteTestCase} title="Delete Test Case"
        message="Are you sure you want to delete this test case? This action cannot be undone."
        confirmText="Delete" confirmButtonClass="btn-danger" />
    </div>
  )
}

export default ProjectDetails
