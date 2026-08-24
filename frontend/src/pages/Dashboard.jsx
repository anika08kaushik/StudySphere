
import {
  CheckCircle2,
  Clock3,
  Flame,
  ListTodo,
  Play,
  ArrowRight,
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={20} />
      </div>

      <div>
        <p className="stat-label">{label}</p>
        <h3>{value}</h3>
        <span>{subtitle}</span>
      </div>
    </div>
  )
}

function Dashboard() {
  const tasks = [
    {
      title: 'Complete ML Assignment',
      subject: 'Machine Learning',
      priority: 'High',
      priorityClass: 'high',
    },
    {
      title: 'CNN Research',
      subject: 'Deep Learning',
      priority: 'Medium',
      priorityClass: 'medium',
    },
    {
      title: 'OS Chapter 4 Notes',
      subject: 'Operating Systems',
      priority: 'Low',
      priorityClass: 'low',
    },
  ]

  return (
    <main className="dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">TUESDAY, AUGUST 25</p>

          <h1>
            Good evening, Yugveer <span>👋</span>
          </h1>

          <p className="header-subtitle">
            Ready to make some progress today?
          </p>
        </div>

        <button className="focus-button">
          <Play size={17} fill="currentColor" />
          Start Focus
        </button>
      </header>

      {/* STATISTICS */}
      <section className="stats-grid">
        <StatCard
          icon={Clock3}
          label="Focus Time"
          value="2h 35m"
          subtitle="+24% this week"
        />

        <StatCard
          icon={ListTodo}
          label="Active Tasks"
          value="8"
          subtitle="3 due this week"
        />

        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value="14"
          subtitle="This month"
        />

        <StatCard
          icon={Flame}
          label="Study Streak"
          value="5 days"
          subtitle="Keep it going!"
        />
      </section>

      {/* MAIN GRID */}
      <section className="dashboard-grid">

        {/* TASKS */}
        <div className="panel tasks-panel">

          <div className="panel-header">
            <div>
              <p className="panel-kicker">PRODUCTIVITY</p>
              <h2>Today's Tasks</h2>
            </div>

            <button className="text-button">
              View all
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="task-list">

            {tasks.map((task) => (
              <div className="task-row" key={task.title}>

                <div className="task-check">
                  <CheckCircle2 size={20} />
                </div>

                <div className="task-info">
                  <strong>{task.title}</strong>
                  <span>{task.subject}</span>
                </div>

                <span className={`priority ${task.priorityClass}`}>
                  {task.priority}
                </span>

              </div>
            ))}

          </div>
        </div>

        {/* FOCUS ROOM */}
        <div className="panel focus-panel">

          <div className="panel-header">

            <div>
              <p className="panel-kicker">FOCUS ROOM</p>
              <h2>Deep Work</h2>
            </div>

            <span className="live-badge">
              <span></span>
              LIVE
            </span>

          </div>

          <div className="focus-content">

            <div className="timer-circle">

              <div>
                <strong>24:37</strong>
                <span>FOCUSING</span>
              </div>

            </div>

            <p className="focus-message">
              You're studying with <strong>3 others</strong>
            </p>

            <div className="avatars">
              <div>R</div>
              <div>A</div>
              <div>M</div>
              <div className="more-avatar">+1</div>
            </div>

            <button className="room-button">
              Enter Focus Room
              <ArrowRight size={17} />
            </button>

          </div>
        </div>

      </section>

      {/* DEADLINES */}
      <section className="panel deadlines-panel">

        <div className="panel-header">

          <div>
            <p className="panel-kicker">UPCOMING</p>
            <h2>Deadlines</h2>
          </div>

          <button className="text-button">
            Calendar
            <ArrowRight size={16} />
          </button>

        </div>

        <div className="deadline-list">

          <div className="deadline-item">

            <div className="deadline-date">
              <strong>26</strong>
              <span>AUG</span>
            </div>

            <div>
              <strong>CNN Assignment</strong>
              <span>Machine Learning · Tomorrow</span>
            </div>

            <span className="deadline-tag urgent">
              Tomorrow
            </span>

          </div>

          <div className="deadline-item">

            <div className="deadline-date">
              <strong>28</strong>
              <span>AUG</span>
            </div>

            <div>
              <strong>OS Case Study</strong>
              <span>Operating Systems · Friday</span>
            </div>

            <span className="deadline-tag">
              3 days
            </span>

          </div>

        </div>

      </section>

    </main>
  )
}

export default Dashboard