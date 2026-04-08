import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import TestCaseCard from '../components/TestCaseCard'
import toast from 'react-hot-toast'

const TestCases = () => {
  const { testCases, projects, addTestCase } = useApp()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Not Run',
    type: 'Functional',
    steps: '',
    expectedResult: '',
    assignedTo: '',
  })

  const filteredTestCases = testCases.filter(tc => {
    const matchesSearch = tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tc.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || tc.status === statusFilter
    const matchesPriority = priorityFilter === 'All' || tc.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.projectId || !formData.description.trim()) {
      toast.error('Title, project, and description are required')
      return
    }

    const stepsArray = formData.steps.split('\n').filter(step => step.trim())

    addTestCase({
      ...formData,
      projectId: parseInt(formData.projectId),
      steps: stepsArray,
    })

    toast.success('Test case created successfully!')
    setShowModal(false)
    setFormData({
      projectId: '',
      title: '',
      description: '',
      priority: 'Medium',
      status: 'Not Run',
      type: 'Functional',
      steps: '',
      expectedResult: '',
      assignedTo: '',
    })
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search test cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Test Case
        </motion.button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field py-1.5 text-sm"
        >
          <option value="All">All Status</option>
          <option value="Passed">Passed</option>
          <option value="Failed">Failed</option>
          <option value="Not Run">Not Run</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="input-field py-1.5 text-sm"
        >
          <option value="All">All Priority</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {filteredTestCases.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No test cases found</p>
          <p className="text-gray-400 text-sm mt-2">Create your first test case to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTestCases.map((testCase, index) => (
            <motion.div
              key={testCase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <TestCaseCard
                testCase={testCase}
                onClick={() => navigate(`/test-cases/${testCase.id}`)}
              />
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Test Case"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project *
            </label>
            <select
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter test case title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field min-h-[100px] resize-none"
              placeholder="Enter detailed test case description"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="Not Run">Not Run</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input-field"
            >
              <option value="Functional">Functional</option>
              <option value="Integration">Integration</option>
              <option value="Performance">Performance</option>
              <option value="Security">Security</option>
              <option value="Usability">Usability</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Steps (one per line)
            </label>
            <textarea
              name="steps"
              value={formData.steps}
              onChange={handleChange}
              className="input-field min-h-[100px] resize-none font-mono text-sm"
              placeholder="Step 1: Navigate to login page&#10;Step 2: Enter credentials&#10;Step 3: Click submit"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Result
            </label>
            <textarea
              name="expectedResult"
              value={formData.expectedResult}
              onChange={handleChange}
              className="input-field min-h-[80px] resize-none"
              placeholder="Describe the expected outcome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned To
            </label>
            <input
              type="text"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter assignee name"
            />
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Create Test Case
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default TestCases