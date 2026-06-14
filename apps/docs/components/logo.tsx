import React from 'react'

export function Logo() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', fontWeight: 900 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderRadius: 10,
          color: 'white',
          background: '#4f46e5',
        }}
      >
        t
      </span>
      <span>tsio</span>
    </span>
  )
}
