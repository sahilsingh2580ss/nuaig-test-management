import { motion } from 'framer-motion'
import { Users, UserCircle } from 'lucide-react'

const getStatusColor = (status) => {
  switch (status) {
    case 'Active':    return 'badge-success'
    case 'Completed': return 'badge-primary'
    case 'On Hold':   return 'badge-warning'
    default:          return 'badge-grey'
  }
}

const ProjectCard = ({ project, onClick }) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    className="card-hover cursor-pointer"
  >
    <div className="flex items-start justify-between mb-3">
      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{project.name}</h3>
      <span className={`badge ${getStatusColor(project.status)} flex-shrink-0 ml-2`}>
        {project.status}
      </span>
    </div>

    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
      {project.description || 'No description provided'}
    </p>

    <div className="space-y-2">
      {project.assignedTo && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <UserCircle className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{project.assignedTo}</span>
        </div>
      )}
      {project.team && project.team.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4 flex-shrink-0" />
          <span>{project.team.length} team member{project.team.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  </motion.div>
)

export default ProjectCard
