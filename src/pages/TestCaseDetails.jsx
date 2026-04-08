import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'

const TestCaseDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getTestCaseById, updateTestCase, deleteTestCase, projects } = useApp()
  const testCase = getTestCaseById(id)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [formData, setFormData] = useState({
    ...testCase,
    steps: Array.isArray(testCase?.steps) ? testCase.steps.join('\n') : testCase?.steps || ''
  })

  if (!testCase) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Test case not found</p>
        <button
          onClick={() => navigate('/test-cases')}
          className="btn-primary mt-4"
        >
          Back to Test Cases
        </button>
      </div>
    )
  }

  const project = projects.find(p => p.id === testCase.projectId)

  const handleUpdate = (e) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required')
      return
    }

    const stepsArray = typeof formData.steps === 'string'
      ? formData.steps.split('\n').filter(step => step.trim())
      : formData.steps

    updateTestCase(testCase.id, {
      ...formData,
      steps: stepsArray,
    })

    toast.success('Test case updated successfully!')
    setShowEditModal(false)
  }

  const handleDelete = () => {
    deleteTestCase(testCase.id)
    toast.success('Test case deleted successfully!')
    navigate('/test-cases')
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Passed': return 'badge-success'
      case 'Failed': return 'badge-error'
      case 'In Progress': return 'badge-warning'
      case 'Blocked': return 'badge bg-red-100 text-red-600'
      case 'Not Run': return 'badge-grey'
      default: return 'badge-grey'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'badge-error'
      case 'High': return 'badge-warning'
      case 'Medium': return 'badge-info'
      default: return 'badge-grey'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Passed': return <CheckCircle className="w-5 h-5 text-success" />
      case 'Failed': return <XCircle className="w-5 h-5 text-danger" />
      default: return <Clock className="w-5 h-5 text-warning" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/test-cases')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{testCase.title}</h1>
          {project && (
            <p className="text-gray-500 mt-1">Project: {project.name}</p>
          )}
        </div>
        <div className="flex gap-2">
          {getStatusIcon(testCase.status)}
          <span className={`badge ${getStatusColor(testCase.status)}`}>
            {testCase.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm font-medium text-gray-500 mb-2">Priority</p>
          <span className={`badge ${getPriorityColor(testCase.priority)}`}>
            {testCase.priority}
          </span>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500 mb-2">Type</p>
          <span className="badge badge-primary">{testCase.type}</span>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500 mb-2">Created By</p>
          <p className="text-gray-900">{testCase.createdBy}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500 mb-2">Assigned To</p>
          <p className="text-gray-900">{testCase.assignedTo || 'Not assigned'}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Test Case Details</h2>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setFormData({
                  ...testCase,
                  steps: Array.isArray(testCase.steps) ? testCase.steps.join('\n') : testCase.steps
                })
                setShowEditModal(true)
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDeleteDialog(true)}
              className="btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </motion.button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <p className="text-gray-900">{testCase.description || 'No description provided'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Test Steps</h3>
            <ol className="list-decimal list-inside space-y-2">
              {testCase.steps && testCase.steps.length > 0 ? (
                testCase.steps.map((step, index) => (
                  <li key={index} className="text-gray-900">{step}</li>
                ))
              ) : (
                <p className="text-gray-400">No steps defined</p>
              )}
            </ol>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Expected Result</h3>
            <p className="text-gray-900">{testCase.expectedResult || 'Not specified'}</p>
          </div>

          {testCase.actualResult && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Actual Result</h3>
              <p className="text-gray-900">{testCase.actualResult}</p>
            </div>
          )}

          {testCase.assignedTo && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned To</h3>
              <span className="badge badge-primary">{testCase.assignedTo}</span>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Created by {testCase.createdBy} on {new Date(testCase.createdAt).toLocaleDateString()}
            </p>
            {testCase.executedBy && (
              <p className="text-sm text-gray-500 mt-1">
                Executed by {testCase.executedBy}
                {testCase.executedDate && ` on ${new Date(testCase.executedDate).toLocaleDateString()}`}
              </p>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Test Case"
      >
        <form onSubmit={handleUpdate} className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className="input-field min-h-[100px] resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status || 'Not Run'}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="Not Run">Not Run</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority || 'Medium'}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Steps (one per line)
            </label>
            <textarea
              name="steps"
              value={formData.steps || ''}
              onChange={handleChange}
              className="input-field min-h-[100px] resize-none font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Result
            </label>
            <textarea
              name="expectedResult"
              value={formData.expectedResult || ''}
              onChange={handleChange}
              className="input-field min-h-[80px] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actual Result
            </label>
            <textarea
              name="actualResult"
              value={formData.actualResult || ''}
              onChange={handleChange}
              className="input-field min-h-[80px] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned To
            </label>
            <input
              type="text"
              name="assignedTo"
              value={formData.assignedTo || ''}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter assignee name"
            />
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Update Test Case
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Test Case"
        message="Are you sure you want to delete this test case? This action cannot be undone."
        confirmText="Delete"
        confirmButtonClass="btn-danger"
      />
    </div>
  )
}

export default TestCaseDetails