import { motion } from 'framer-motion'
import { AlertTriangle, Bug, Zap } from 'lucide-react'

const DefectCard = ({ defect, onClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'badge-error'
      case 'In Progress': return 'badge-warning'
      case 'Resolved': return 'badge-success'
      case 'Closed': return 'badge-grey'
      default: return 'badge-info'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'badge-error'
      case 'High': return 'badge-warning'
      case 'Medium': return 'badge-info'
      default: return 'badge-grey'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'Critical': return <Zap className="w-5 h-5 text-danger" />
      case 'High': return <AlertTriangle className="w-5 h-5 text-warning" />
      default: return <Bug className="w-5 h-5 text-info" />
    }
  }

  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="card-hover cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {getSeverityIcon(defect.severity)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{defect.title}</h3>
            <div className="flex gap-2 flex-shrink-0">
              <span className={`badge ${getStatusColor(defect.status)}`}>
                {defect.status}
              </span>
              <span className={`badge ${getSeverityColor(defect.severity)}`}>
                {defect.severity}
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {defect.description || 'No description provided'}
          </p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="badge badge-primary">{defect.type}</span>
            <span>{defect.environment}</span>
            {defect.reportedBy && (
              <span>Reported by {defect.reportedBy}</span>
            )}
            {defect.reportedDate && (
              <span>on {new Date(defect.reportedDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default DefectCard