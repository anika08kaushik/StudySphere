import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function CreateGroup({ isOpen, onClose }) {
  const [form, setForm] = useState({ name: '', description: '', subjects: '' })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: connect to groupService.createGroup
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Study Group">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Group Name" name="name" placeholder="Machine Learning" value={form.name} onChange={handleChange} required />
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="What will this group study?"
            value={form.description}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          />
        </div>
        <Input label="Subjects (comma separated)" name="subjects" placeholder="Neural Networks, CNN, Regression" value={form.subjects} onChange={handleChange} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create Group</Button>
        </div>
      </form>
    </Modal>
  )
}
