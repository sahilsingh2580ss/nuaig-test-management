import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import DefectCard from '../components/DefectCard'
import toast from 'react-hot-toast'

const DefectTracker = () => {
  const { defects, projects, addDefect, user, registeredUsers } = useApp()
  const navigate = useNavigate()

  const [showModal,     setShowModal]     = useState(false)
  const [searchTerm,    setSearchTerm]    = useState('')
  const [statusFilter,  setStatusFilter]  = useState('All')
  const [projectFilter, setProjectFilter] = useState('All')

  const emptyForm = {
    projectId: '', title: '', description: '',
    severity: 'Medium', priority: 'Medium', type: 'Bug',
    assignedTo: '',
    stepsToReproduce: '', expectedBehavior: '', actualBehavior: '',
    environment: 'Production', browser: '',
  }
  const [formData, setFormData] = useState(emptyForm)

  // ── Signed-in users list (deduped by fullName) ─────────────────────────
  // Only show Developer and QA users in Assigned To dropdown
  const userOptions = registeredUsers
    .filter(u => ['Developer', 'QA'].includes(u.role))
    .map(u => u.fullName)

  // ── Filtered list ──────────────────────────────────────────────────────
  const filtered = defects.filter(d => {
    const q = searchTerm.toLowerCase()
    return (
      (d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)) &&
      (statusFilter  === 'All' || d.status    === statusFilter) &&
      (projectFilter === 'All' || d.projectId === parseInt(projectFilter))
    )
  })

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.projectId) {
      toast.error('Title and project are required'); return
    }
    const steps = formData.stepsToReproduce.split('\n').filter(s => s.trim())
    addDefect({ ...formData, projectId: parseInt(formData.projectId), stepsToReproduce: steps })
    toast.success('Defect reported successfully!')
    setShowModal(false)
    setFormData(emptyForm)
  }

  return (
    <div className="space-y-6">
      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text" placeholder="Search defects…"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Report Defect
        </motion.button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-1.5 text-sm w-auto">
          <option value="All">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
          <option value="Reopened">Reopened</option>
        </select>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="input-field py-1.5 text-sm w-auto">
          <option value="All">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No defects found</p>
          <p className="text-gray-400 text-sm mt-2">Report your first defect to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((defect, i) => (
            <motion.div key={defect.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <DefectCard defect={defect} onClick={() => navigate(`/defects/${defect.id}`)} />
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFormData(emptyForm) }} title="Report New Defect">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[65vh]">
          <div className="overflow-y-auto pr-1 space-y-4 flex-1 scrollbar-thin">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
              <select name="projectId" value={formData.projectId} onChange={handleChange} className="input-field" required>
                <option value="">Select a project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange}
                className="input-field" placeholder="Brief description of the defect" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange}
                className="input-field min-h-[80px] resize-none" placeholder="Detailed description of the defect" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                <select name="severity" value={formData.severity} onChange={handleChange} className="input-field">
                  <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange} className="input-field">
                  <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="input-field">
                <option value="Bug">Bug</option>
                <option value="Crash">Crash</option>
                <option value="Performance">Performance</option>
                <option value="UI">UI/UX Issue</option>
                <option value="Security">Security</option>
              </select>
            </div>

            {/* ── Assigned To – shows every user who has ever logged in ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="input-field">
                <option value="">— Select a user —</option>
                {userOptions.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Steps to Reproduce <span className="font-normal text-gray-400">(one per line)</span></label>
              <textarea name="stepsToReproduce" value={formData.stepsToReproduce} onChange={handleChange}
                className="input-field min-h-[100px] resize-none font-mono text-sm"
                placeholder={"Step 1: Open the application\nStep 2: Navigate to…\nStep 3: Click on…"} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expected Behavior</label>
              <textarea name="expectedBehavior" value={formData.expectedBehavior} onChange={handleChange}
                className="input-field min-h-[60px] resize-none" placeholder="What should happen" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actual Behavior</label>
              <textarea name="actualBehavior" value={formData.actualBehavior} onChange={handleChange}
                className="input-field min-h-[60px] resize-none" placeholder="What actually happens" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                <select name="environment" value={formData.environment} onChange={handleChange} className="input-field">
                  <option>Production</option><option>Staging</option>
                  <option>Development</option><option>Testing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Browser / Platform</label>
                <input type="text" name="browser" value={formData.browser} onChange={handleChange}
                  className="input-field" placeholder="e.g. Chrome 120, iOS 17" />
              </div>
            </div>

          </div>

          {/* ── Sticky footer ── */}
          <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100 bg-white flex-shrink-0">
            <button type="button" onClick={() => { setShowModal(false); setFormData(emptyForm) }} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Report Defect</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default DefectTracker
