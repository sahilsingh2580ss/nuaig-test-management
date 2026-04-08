import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

const TestCaseCard = ({ testCase, onClick }) => {
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
      case 'Blocked': return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <Clock className="w-5 h-5 text-warning" />
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
          {getStatusIcon(testCase.status)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{testCase.title}</h3>
            <div className="flex gap-2 flex-shrink-0">
              <span className={`badge ${getStatusColor(testCase.status)}`}>
                {testCase.status}
              </span>
              <span className={`badge ${getPriorityColor(testCase.priority)}`}>
                {testCase.priority}
              </span>
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {testCase.description || 'No description provided'}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="badge badge-primary">{testCase.type}</span>
            {testCase.executedBy && (
              <span>Executed by {testCase.executedBy}</span>
            )}
            {testCase.executedDate && (
              <span>on {new Date(testCase.executedDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default TestCaseCard