import { useState } from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, FolderKanban, Bug, ClipboardCheck, FlaskConical } from 'lucide-react'
import Projects from './Projects'
import DefectTracker from './DefectTracker'
import TestingOverview from './TestingOverview'
import TestSuite from './TestSuite'

const tabs = [
  { id: 'projects',  label: 'Projects',         icon: FolderKanban,   component: Projects },
  { id: 'defects',   label: 'Defect Tracker',    icon: Bug,            component: DefectTracker },
  { id: 'suites',    label: 'Test Suite',         icon: FlaskConical,   component: TestSuite },
  { id: 'overview',  label: 'Testing Overview',   icon: ClipboardCheck, component: TestingOverview },
]

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('projects')
  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab bar */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px min-w-max">
            {tabs.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                  {active && (
                    <motion.div layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}>
            {ActiveComponent && <ActiveComponent />}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
