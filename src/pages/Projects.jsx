import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import ProjectCard from '../components/ProjectCard'
import StatCard from '../components/StatCard'
import toast from 'react-hot-toast'

const ASSIGNABLE_ROLES = ['Developer', 'QA']

const Projects = () => {
  const { projects, addProject, getOverallStats, user, registeredUsers } = useApp()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active',
    assignedTo: '',
  })

  const stats = getOverallStats()

  // Only show Developer and QA users in Assigned To dropdown
  const userOptions = registeredUsers
    .filter(u => ASSIGNABLE_ROLES.includes(u.role))
    .map(u => u.fullName)

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Project name is required')
      return
    }
    addProject(formData)
    toast.success('Project created successfully!')
    setShowModal(false)
    setFormData({ name: '', description: '', status: 'Active', assignedTo: '' })
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Projects" value={stats.totalProjects} color="primary" />
        <StatCard title="Active Projects" value={stats.activeProjects} color="success" />
        <StatCard title="Total Test Cases" value={stats.totalTestCases} color="info" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
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
          New Project
        </motion.button>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No projects found</p>
          <p className="text-gray-400 text-sm mt-2">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProjectCard project={project} onClick={() => navigate(`/projects/${project.id}`)} />
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Project">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[65vh]">
          {/* Scrollable fields area */}
          <div className="overflow-y-auto pr-1 space-y-4 flex-1 scrollbar-thin">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter project name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field min-h-[100px] resize-none"
                placeholder="Enter project description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="input-field">
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="input-field">
                <option value="">-- Select a user --</option>
                {userOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sticky action buttons */}
          <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100 bg-white">
            <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create Project</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Projects
