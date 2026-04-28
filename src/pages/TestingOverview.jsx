import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, Activity } from 'lucide-react'
import StatCard from '../components/StatCard'

const TestingOverview = () => {
  const { testCases, defects, getOverallStats, activityLog } = useApp()
  const stats = getOverallStats()

  const passRate     = stats.totalTestCases === 0 ? 0 : Math.round((stats.passedTestCases / stats.totalTestCases) * 100)
  const failRate     = stats.totalTestCases === 0 ? 0 : Math.round((stats.failedTestCases / stats.totalTestCases) * 100)
  const defectRate   = stats.totalTestCases === 0 ? 0 : Math.round((stats.totalDefects    / stats.totalTestCases) * 100)
  const pendingCount = stats.totalTestCases - stats.passedTestCases - stats.failedTestCases

  // ── Activity feed helpers ─────────────────────────────────────────────────
  const activityIcon = (item) => {
    if (item._type === 'test-case') {
      if (item.status === 'Passed') return <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
      if (item.status === 'Failed') return <XCircle     className="w-5 h-5 text-danger  flex-shrink-0" />
      return <Clock className="w-5 h-5 text-warning flex-shrink-0" />
    }
    return <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0" />
  }

  const activityText = (item) => {
    // label is captured at log time — always has the real name, never empty
    const name = item.label || '(unnamed)'
    if (item._type === 'test-case') {
      if (item._action === 'created')        return `"${name}" created`
      if (item._action === 'status-changed') return `"${name}" status changed to ${item.status}`
      return `"${name}" updated`
    }
    // defect
    if (item._action === 'reported')       return `Defect "${name}" reported (${item.severity})`
    if (item._action === 'status-changed') return `Defect "${name}" status changed from ${item.prevStatus} to ${item.status}`
    return `Defect "${name}" updated`
  }

  const activityBadge = (item) => {
    if (item._type === 'test-case')
      return item.status === 'Passed' ? 'badge-success' : item.status === 'Failed' ? 'badge-error' : 'badge-grey'
    return item.severity === 'Critical' ? 'badge-error' : 'badge-warning'
  }

  const activityLabel = (item) =>
    item._type === 'test-case' ? item.status : (item.status || item.severity)

  return (
    <div className="space-y-6">

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects"    value={stats.totalProjects}    icon={<Activity       className="w-6 h-6" />} color="primary" />
        <StatCard title="Active Projects"   value={stats.activeProjects}   icon={<TrendingUp     className="w-6 h-6" />} color="success" />
        <StatCard title="Total Test Cases"  value={stats.totalTestCases}   icon={<CheckCircle    className="w-6 h-6" />} color="info"    />
        <StatCard title="Total Defects"     value={stats.totalDefects}     icon={<AlertTriangle  className="w-6 h-6" />} color="danger"  />
      </div>

      {/* ── Three status panels ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Test Case Status */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Test Case Status</h3>
          <div className="space-y-3">
            {[
              { icon: <CheckCircle className="w-4 h-4 text-success" />, label: 'Passed',  value: stats.passedTestCases },
              { icon: <XCircle     className="w-4 h-4 text-danger"  />, label: 'Failed',  value: stats.failedTestCases },
              { icon: <Clock       className="w-4 h-4 text-gray-400"/>, label: 'Pending', value: pendingCount          },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Defect Status */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Defect Status</h3>
          <div className="space-y-3">
            {[
              { icon: <AlertTriangle className="w-4 h-4 text-danger"  />, label: 'Open',     value: stats.openDefects                          },
              { icon: <AlertTriangle className="w-4 h-4 text-warning" />, label: 'Critical',  value: stats.criticalDefects                      },
              { icon: <CheckCircle   className="w-4 h-4 text-success" />, label: 'Resolved', value: stats.totalDefects - stats.openDefects      },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Metrics — FIXED LAYOUT */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Quality Metrics</h3>
          <div className="space-y-5">

            {/* Pass Rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-700">Pass Rate</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{passRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-success"
                  initial={{ width: 0 }}
                  animate={{ width: `${passRate}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{stats.passedTestCases} of {stats.totalTestCases} test cases</p>
            </div>

            {/* Fail Rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-700">Fail Rate</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{failRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-danger"
                  initial={{ width: 0 }}
                  animate={{ width: `${failRate}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{stats.failedTestCases} of {stats.totalTestCases} test cases</p>
            </div>

            {/* Defect Rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-700">Defect Rate</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{defectRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-warning"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(defectRate, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{stats.totalDefects} defects vs {stats.totalTestCases} test cases</p>
            </div>

          </div>
        </div>
      </div>

      {/* ── Recent activity ── */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
        {activityLog.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity — create a test case or report a defect to begin</p>
        ) : (
          <div className="space-y-2">
            {activityLog.map((item, i) => (
              <motion.div key={item._id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                {activityIcon(item)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{activityText(item)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(item._date).toLocaleDateString()} at {new Date(item._date).toLocaleTimeString()}
                  </p>
                </div>
                <span className={`badge ${activityBadge(item)} flex-shrink-0`}>{activityLabel(item)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default TestingOverview
