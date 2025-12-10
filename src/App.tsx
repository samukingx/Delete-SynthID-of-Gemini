import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import ProcessImage from '@/pages/ProcessImage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="process" element={<ProcessImage />} />
      </Route>
    </Routes>
  )
}
