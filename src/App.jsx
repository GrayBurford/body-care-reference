import { useState, useEffect, useRef } from 'react'
import seedData from './seedData.json'
import './App.css'

const STORAGE_KEY = 'body-care-data'

const FREQ = {
  d: { label: 'Daily', color: '#16a34a' },
  w: { label: 'Weekly', color: '#2563eb' },
  m: { label: 'Monthly', color: '#9333ea' },
  s: { label: 'Seasonal', color: '#c2410c' },
}
const FREQ_KEYS = ['d', 'w', 'm', 's']

const SECTION_COLORS = {
  exterior: '#0d9488',
  sensory: '#7c3aed',
  structural: '#2563eb',
  internal: '#ea580c',
  cancer: '#dc2626',
  cognitive: '#ca8a04',
}
const COLOR_KEYS = Object.keys(SECTION_COLORS)

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function loadSections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return seedData.sections
}

function EditableText({ value, onSave, multiline, className, placeholder }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus()
      if (!multiline) ref.current.select()
    }
  }, [editing, multiline])

  function start() {
    setDraft(value)
    setEditing(true)
  }

  function save() {
    onSave(draft.trim() || value)
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (!multiline && e.key === 'Enter') { e.preventDefault(); save() }
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    const shared = {
      ref,
      value: draft,
      onChange: e => setDraft(e.target.value),
      onBlur: save,
      onKeyDown: handleKeyDown,
      className: `editable-input ${className || ''}`,
      placeholder: placeholder || '',
    }
    return multiline
      ? <textarea {...shared} rows={Math.max(2, Math.ceil(value.length / 55))} />
      : <input {...shared} type="text" />
  }

  return (
    <span className={`editable ${className || ''}`} onClick={start} title="Click to edit">
      {value || <span className="editable-placeholder">{placeholder}</span>}
    </span>
  )
}

function RowItem({ row, onUpdate, onDelete }) {
  const [editFreq, setEditFreq] = useState(false)
  const freq = FREQ[row.freq] || FREQ.d

  return (
    <div className="row-item">
      <div className="row-top">
        {editFreq ? (
          <select
            className="freq-select"
            value={row.freq}
            onChange={e => { onUpdate({ freq: e.target.value }); setEditFreq(false) }}
            onBlur={() => setEditFreq(false)}
            autoFocus
          >
            {FREQ_KEYS.map(k => (
              <option key={k} value={k}>{FREQ[k].label}</option>
            ))}
          </select>
        ) : (
          <span
            className="freq-badge"
            style={{ background: freq.color }}
            onClick={() => setEditFreq(true)}
            title="Click to change frequency"
          >
            {freq.label}
          </span>
        )}
        <button className="btn-icon btn-delete" onClick={onDelete} aria-label="Delete row">×</button>
      </div>
      <EditableText
        value={row.text}
        onSave={text => onUpdate({ text })}
        multiline
        className="row-text"
        placeholder="Enter row text"
      />
    </div>
  )
}

function CardBlock({ card, sectionColor, onUpdate, onDelete, onAddRow, onUpdateRow, onDeleteRow }) {
  return (
    <div className="card" style={{ '--section-color': sectionColor }}>
      <div className="card-header">
        <div className="card-title-row">
          <EditableText
            value={card.title}
            onSave={title => onUpdate({ title })}
            className="card-title"
            placeholder="Card title"
          />
          <button className="btn-icon btn-delete btn-delete-card" onClick={onDelete} aria-label="Delete card">×</button>
        </div>
        <EditableText
          value={card.sub}
          onSave={sub => onUpdate({ sub })}
          multiline
          className="card-sub"
          placeholder="Add a description"
        />
      </div>
      <div className="row-list">
        {card.rows.map(row => (
          <RowItem
            key={row.id}
            row={row}
            onUpdate={changes => onUpdateRow(row.id, changes)}
            onDelete={() => onDeleteRow(row.id)}
          />
        ))}
      </div>
      <button className="btn-add" onClick={onAddRow}>+ Add row</button>
    </div>
  )
}

function SectionBlock({ section, onUpdate, onDelete, onAddCard, onUpdateCard, onDeleteCard, onAddRow, onUpdateRow, onDeleteRow }) {
  const [colorOpen, setColorOpen] = useState(false)
  const color = SECTION_COLORS[section.colorKey] || '#6b7280'

  return (
    <div className="section-block" id={`section-${section.id}`}>
      <div className="section-header">
        <span className="section-dot" style={{ background: color }} />
        <EditableText
          value={section.label}
          onSave={label => onUpdate({ label })}
          className="section-label"
          placeholder="Section name"
        />
        <div className="section-actions">
          <button
            className="btn-icon btn-color-toggle"
            style={{ color }}
            onClick={() => setColorOpen(v => !v)}
            title="Change color"
          >
            ●
          </button>
          <button
            className="btn-icon btn-delete"
            onClick={() => {
              if (window.confirm(`Delete "${section.label}" and all its cards?`)) onDelete()
            }}
            aria-label="Delete section"
          >
            ×
          </button>
        </div>
      </div>

      {colorOpen && (
        <div className="color-picker">
          {COLOR_KEYS.map(key => (
            <button
              key={key}
              className={`color-swatch${section.colorKey === key ? ' active' : ''}`}
              style={{ background: SECTION_COLORS[key] }}
              onClick={() => { onUpdate({ colorKey: key }); setColorOpen(false) }}
              aria-label={`Color: ${key}`}
            />
          ))}
        </div>
      )}

      <div className="card-grid">
        {section.cards.map(card => (
          <CardBlock
            key={card.id}
            card={card}
            sectionColor={color}
            onUpdate={changes => onUpdateCard(card.id, changes)}
            onDelete={() => onDeleteCard(card.id)}
            onAddRow={() => onAddRow(card.id)}
            onUpdateRow={(rowId, changes) => onUpdateRow(card.id, rowId, changes)}
            onDeleteRow={rowId => onDeleteRow(card.id, rowId)}
          />
        ))}
        <button className="btn-add btn-add-card" onClick={onAddCard}>+ Add card</button>
      </div>
    </div>
  )
}

function Sidebar({ sections }) {
  function scrollTo(id) {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-inner">
        <p className="sidebar-heading">Sections</p>
        <ul className="sidebar-list">
          {sections.map(section => {
            const color = SECTION_COLORS[section.colorKey] || '#6b7280'
            return (
              <li key={section.id}>
                <button className="sidebar-link" onClick={() => scrollTo(section.id)}>
                  <span className="sidebar-dot" style={{ background: color }} />
                  <span>{section.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

export default function App() {
  const [sections, setSections] = useState(loadSections)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sections)) } catch {}
  }, [sections])

  function update(fn) { setSections(prev => fn(prev)) }

  function addSection() {
    update(prev => [...prev, {
      id: uid(), label: 'New Section',
      colorKey: COLOR_KEYS[prev.length % COLOR_KEYS.length],
      cards: [],
    }])
  }
  function updateSection(id, changes) {
    update(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s))
  }
  function deleteSection(id) {
    update(prev => prev.filter(s => s.id !== id))
  }

  function addCard(sectionId) {
    update(prev => prev.map(s => s.id !== sectionId ? s : {
      ...s, cards: [...s.cards, { id: uid(), title: 'New Card', sub: '', genderTag: null, rows: [] }]
    }))
  }
  function updateCard(sectionId, cardId, changes) {
    update(prev => prev.map(s => s.id !== sectionId ? s : {
      ...s, cards: s.cards.map(c => c.id === cardId ? { ...c, ...changes } : c)
    }))
  }
  function deleteCard(sectionId, cardId) {
    update(prev => prev.map(s => s.id !== sectionId ? s : {
      ...s, cards: s.cards.filter(c => c.id !== cardId)
    }))
  }

  function addRow(sectionId, cardId) {
    update(prev => prev.map(s => s.id !== sectionId ? s : {
      ...s, cards: s.cards.map(c => c.id !== cardId ? c : {
        ...c, rows: [...c.rows, { id: uid(), freq: 'd', text: 'New row' }]
      })
    }))
  }
  function updateRow(sectionId, cardId, rowId, changes) {
    update(prev => prev.map(s => s.id !== sectionId ? s : {
      ...s, cards: s.cards.map(c => c.id !== cardId ? c : {
        ...c, rows: c.rows.map(r => r.id === rowId ? { ...r, ...changes } : r)
      })
    }))
  }
  function deleteRow(sectionId, cardId, rowId) {
    update(prev => prev.map(s => s.id !== sectionId ? s : {
      ...s, cards: s.cards.map(c => c.id !== cardId ? c : {
        ...c, rows: c.rows.filter(r => r.id !== rowId)
      })
    }))
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Body Care Reference</h1>
          <p className="app-subtitle">Evidence-based health maintenance for the long game</p>
          <div className="header-dots">
            {COLOR_KEYS.map(key => (
              <span key={key} className="header-dot" style={{ background: SECTION_COLORS[key] }} />
            ))}
          </div>
        </div>
      </header>

      <div className="app-body">
        <Sidebar sections={sections} />
        <main>
          {sections.map(section => (
            <SectionBlock
              key={section.id}
              section={section}
              onUpdate={changes => updateSection(section.id, changes)}
              onDelete={() => deleteSection(section.id)}
              onAddCard={() => addCard(section.id)}
              onUpdateCard={(cardId, changes) => updateCard(section.id, cardId, changes)}
              onDeleteCard={cardId => deleteCard(section.id, cardId)}
              onAddRow={cardId => addRow(section.id, cardId)}
              onUpdateRow={(cardId, rowId, changes) => updateRow(section.id, cardId, rowId, changes)}
              onDeleteRow={(cardId, rowId) => deleteRow(section.id, cardId, rowId)}
            />
          ))}
          <button className="btn-add btn-add-section" onClick={addSection}>+ Add section</button>
        </main>
      </div>
    </div>
  )
}
