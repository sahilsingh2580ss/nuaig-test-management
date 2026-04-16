import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Trash2, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'

const DefectDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getDefectById, updateDefect, deleteDefect, projects, registeredUsers } = useApp()
  const defect = getDefectById(id)

  const [showEditModal,    setShowEditModal]    = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [formData,         setFormData]         = useState(defect || {})

  if (!defect) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Defect not found</p>
        <button onClick={() => navigate('/defects')} className="btn-primary mt-4">Back to Defects</button>
      </div>
    )
  }

  const project = projects.find(p => p.id === defect.projectId)

  // All users who have ever logged in
  // Only show Developer and QA users in Assigned To dropdown
  const userOptions = registeredUsers
    .filter(u => ['Developer', 'QA'].includes(u.role))
    .map(u => u.fullName)

  const handleUpdate = (e) => {
    e.preventDefault()
    const steps = typeof formData.stepsToReproduce === 'string'
      ? formData.stepsToReproduce.split('\n').filter(s => s.trim())
      : formData.stepsToReproduce
    updateDefect(defect.id, { ...formData, stepsToReproduce: steps })
    toast.success('Defect updated successfully!')
    setShowEditModal(false)
  }

  const handleDelete = () => {
    deleteDefect(defect.id)
    toast.success('Defect deleted successfully!')
    navigate('/defects')
  }

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const getStatusColor = (s) =>
    ({ Open:'badge-error', 'In Progress':'badge-warning', Resolved:'badge-success', Closed:'badge-grey' }[s] ?? 'badge-info')
  const getSeverityColor = (s) =>
    ({ Critical:'badge-error', High:'badge-warning', Medium:'badge-info' }[s] ?? 'badge-grey')

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate('/defects')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 truncate">{defect.title}</h1>
          {project && <p className="text-gray-500 mt-1">Project: {project.name}</p>}
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-danger" />
          <span className={`badge ${getStatusColor(defect.status)}`}>{defect.status}</span>
        </div>
      </div>

      {/* ── Quick stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm font-medium text-gray-500 mb-2">Severity</p>
          <span className={`badge ${getSeverityColor(defect.severity)}`}>{defect.severity}</span></div>
        <div className="card"><p className="text-sm font-medium text-gray-500 mb-2">Priority</p>
          <span className={`badge ${getSeverityColor(defect.priority)}`}>{defect.priority}</span></div>
        <div className="card"><p className="text-sm font-medium text-gray-500 mb-2">Type</p>
          <span className="badge badge-primary">{defect.type}</span></div>
        <div className="card"><p className="text-sm font-medium text-gray-500 mb-2">Environment</p>
          <p className="text-gray-900">{defect.environment}</p></div>
      </div>

      {/* ── Detail card ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Defect Details</h2>
          <div className="flex gap-2">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => {
                setFormData({
                  ...defect,
                  stepsToReproduce: Array.isArray(defect.stepsToReproduce)
                    ? defect.stepsToReproduce.join('\n')
                    : defect.stepsToReproduce,
                })
                setShowEditModal(true)
              }}
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

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <p className="text-gray-900">{defect.description || 'No description provided'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Steps to Reproduce</h3>
            <ol className="list-decimal list-inside space-y-2">
              {defect.stepsToReproduce && defect.stepsToReproduce.length > 0
                ? defect.stepsToReproduce.map((step, i) => <li key={i} className="text-gray-900">{step}</li>)
                : <p className="text-gray-400">No steps provided</p>}
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Expected Behavior</h3>
              <p className="text-gray-900">{defect.expectedBehavior || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Actual Behavior</h3>
              <p className="text-gray-900">{defect.actualBehavior || 'Not specified'}</p>
            </div>
          </div>

          {defect.browser && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Browser / Platform</h3>
              <p className="text-gray-900">{defect.browser}</p>
            </div>
          )}

          {defect.assignedTo && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned To</h3>
              <span className="badge badge-primary">{defect.assignedTo}</span>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Reported by <span className="font-medium">{defect.reportedBy}</span>
              {' on '}{new Date(defect.reportedDate || defect.createdAt).toLocaleDateString()}
            </p>
            {defect.resolvedDate && (
              <p className="text-sm text-gray-500 mt-1">
                Resolved on {new Date(defect.resolvedDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Defect Modal ── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Defect">
        <form onSubmit={handleUpdate} className="flex flex-col max-h-[65vh]">
          <div className="overflow-y-auto pr-1 space-y-4 flex-1 scrollbar-thin">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input type="text" name="title" value={formData.title || ''} onChange={handleChange}
                className="input-field" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea name="description" value={formData.description || ''} onChange={handleChange}
                className="input-field min-h-[80px] resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select name="status" value={formData.status || 'Open'} onChange={handleChange} className="input-field">
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                  <option value="Reopened">Reopened</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                <select name="severity" value={formData.severity || 'Medium'} onChange={handleChange} className="input-field">
                  <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select name="priority" value={formData.priority || 'Medium'} onChange={handleChange} className="input-field">
                <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>

            {/* ── Assigned To — all signed-in users ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              <select name="assignedTo" value={formData.assignedTo || ''} onChange={handleChange} className="input-field">
                <option value="">— Select a user —</option>
                {userOptions.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Steps to Reproduce <span className="font-normal text-gray-400">(one per line)</span></label>
              <textarea name="stepsToReproduce" value={formData.stepsToReproduce || ''} onChange={handleChange}
                className="input-field min-h-[100px] resize-none font-mono text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expected Behavior</label>
              <textarea name="expectedBehavior" value={formData.expectedBehavior || ''} onChange={handleChange}
                className="input-field min-h-[60px] resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actual Behavior</label>
              <textarea name="actualBehavior" value={formData.actualBehavior || ''} onChange={handleChange}
                className="input-field min-h-[60px] resize-none" />
            </div>

          </div>
          <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100 bg-white flex-shrink-0">
            <button type="button" onClick={() => setShowEditModal(false)} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Update Defect</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete} title="Delete Defect"
        message="Are you sure you want to delete this defect? This action cannot be undone."
        confirmText="Delete" confirmButtonClass="btn-danger" />
    </div>
  )
}

export default DefectDetails
