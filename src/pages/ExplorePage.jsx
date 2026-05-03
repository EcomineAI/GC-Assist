import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, BookOpen, Calendar, Users,
  HeartHandshake, Building2, GraduationCap, Megaphone,
  Phone, Landmark, Search, SearchX
} from 'lucide-react'

const CATEGORIES = [
  {
    id: 'enrollment',
    name: 'Admission & Enrollment',
    desc: 'Freshmen, transferees, returnees, IGS',
    icon: ClipboardList,
    info: [
      'Freshmen must pass the Gordon College Admission Test (GCAT).',
      'Requirements: Original HS Report Card (F138/SF9), Good Moral Certificate, PSA Birth Certificate, Medical Cert from GC Clinic, Barangay Residency Cert, and 2x2 photo.',
      'Transferees need: Transfer Credential, Good Moral Certificate, Birth Cert, Medical Cert, Barangay Residency Cert, and 2x2 photo.',
      'Returning students who did not request transfer credentials are not required to take the admission test.',
      'IGS applicants must have a minimum GPA of 2.00 (85%) and pay a Php200 non-refundable application fee.',
      'Cross-enrollment requires written permission and Dean recommendation.',
    ],
    prompt: 'What are the admission and enrollment requirements at Gordon College?',
  },
  {
    id: 'programs',
    name: 'Academic Programs',
    desc: '6 colleges, graduate studies, 20+ programs',
    icon: GraduationCap,
    info: [
      'Institute of Graduate Studies (IGS): MA in Nursing, MA in Education, Master in Business Management, Master in Public Administration.',
      'College of Allied Health Studies (CAHS): BS Nursing, BS Midwifery.',
      'College of Business and Accountancy (CBA): BS Accountancy, BSBA (Financial Mgmt, HR Mgmt, Marketing Mgmt), BS Customs Administration.',
      'College of Computer Studies (CCS): BS Computer Science, BS Entertainment & Multimedia Computing, BS Information Technology.',
      'College of Education, Arts & Sciences (CEAS): BA Communication, BEEd, BSEd (English, Filipino, Math, Social Studies, Science), BPE, BCAE, BECE, TCP.',
      'College of Hospitality & Tourism Management (CHTM): BS Hospitality Management, BS Tourism Management.',
      'Multiple programs hold ALCU-COA Level 1–3 accreditation.',
    ],
    prompt: 'What academic programs and colleges does Gordon College have?',
  },
  {
    id: 'calendar',
    name: 'Academic Calendar',
    desc: 'Semester dates, holidays, exams',
    icon: Calendar,
    info: [
      'The academic year has two regular semesters and a midyear (summer) term.',
      'First Semester typically runs August to December.',
      'Second Semester typically runs January to May.',
      'Midyear/Summer classes run June to July.',
      'Prelim, Midterm, and Final exams are scheduled each semester.',
      'Check the GC website Academics > Academic Calendar for exact dates.',
    ],
    prompt: 'What is the academic calendar for Gordon College?',
  },
  {
    id: 'about',
    name: 'About Gordon College',
    desc: 'History, vision, mission, seal',
    icon: Landmark,
    info: [
      'Founded in 1999 as Olongapo City Colleges, renamed to Gordon College in 2002 (City Ordinance No. 42, Series of 2002).',
      'Named in honor of the Gordon family who contributed to the development of Olongapo City.',
      'Vision: A globally recognized local institution committed to innovative academic excellence, holistic development, inclusivity, and community engagement.',
      'Core Values: Character, Excellence, and Service.',
      'Located at Olongapo City Sports Complex, Donor Street, East Tapinac, Olongapo City 2200.',
      'The college seal features "Ulo ng Apo," a torch, book, laurel wreath, and shield in green and yellow.',
    ],
    prompt: 'Tell me about the history and mission of Gordon College',
  },
  {
    id: 'services',
    name: 'Student Services (OSWS)',
    desc: 'Guidance, health, orgs, discipline',
    icon: HeartHandshake,
    info: [
      'The Office of Student Welfare & Services (OSWS) is the primary frontline office for students.',
      'Units under OSWS: Guidance, Discipline, Sports Development, Student Publication, Health Services, Culture & Arts, Student Organizations, Admission Services, Career & Job Placement.',
      'The Supreme Student Council (SSC) is the official student government — gcssc@gordoncollege.edu.ph.',
      'Recognized student organizations include JPIA, ELITES, SPECS, IMAGES, JFinEx, JPMAP, LELLS, and more.',
      'OSWS contact: (047) 222-4080 Loc. 313 | Rm. 320, 3rd Floor, GC Building.',
    ],
    prompt: 'What student services and organizations are available at Gordon College?',
  },
  {
    id: 'facilities',
    name: 'Campus Facilities',
    desc: 'Library, clinic, research, publications',
    icon: Building2,
    info: [
      'The Cosme Y. Sering Library was renovated and officially blessed in January 2025.',
      'The library partners with DOST Starbooks for digital learning resources.',
      '"The Forefront" is the official student publication, located at Rm. 516, 5th Floor, GC Main Building.',
      'Research journals include: The Apo, CAPSICUM, CERTO ERUDITIO, Computing Research Journal, YAMANTAO, ADUANA, and KAYAMANAN.',
      'The GC Community Extension Services Unit (CESU) leads outreach programs like Brigada Eskwela and reading literacy initiatives.',
    ],
    prompt: 'Tell me about campus facilities and resources at Gordon College',
  },
  {
    id: 'administration',
    name: 'Administration & Offices',
    desc: 'President, VP offices, departments',
    icon: Users,
    info: [
      'Office of the College President (OCP): Loc. 302, Rm. 303 — oversees Executive Council, Registrar, UniFAST, Data Privacy, Records Management.',
      'VP Academic Affairs: Loc. 314, Rm. 308 — oversees all 6 colleges, library, Office of Instruction.',
      'VP Administration & Finance: Loc. 324 — Finance, HR, Supply, MIS, Security, Maintenance, DRRM.',
      'VP Student Welfare & Services: Loc. 313, Rm. 320 — Guidance, Discipline, Sports, Health, Career Placement.',
      'RDCES: Loc. 307, Rm. 305 — Research Development, Community Extension, Publication & IP.',
      'IPDEA: Loc. 304 — Quality Assurance, International Affairs, Partnerships, DEI, Alumni Affairs.',
      'Board of Trustees Chairperson: Hon. Rolen C. Paulino, Jr.',
    ],
    prompt: 'Tell me about the administration and offices at Gordon College',
  },
  {
    id: 'contact',
    name: 'Contact & Directory',
    desc: 'Phone numbers, emails, office hours',
    icon: Phone,
    info: [
      'Main hotline: (047) 222-4080.',
      'Email: info@gordoncollege.edu.ph | GCAT concerns: info.gcat@gordoncollege.edu.ph.',
      'Registrar: Loc. 102 | registrar@gordoncollege.edu.ph.',
      'Guidance & Admission: Loc. 311 | guidance.unit@gordoncollege.edu.ph.',
      'Finance: Loc. 101 | gcpay@gordoncollege.edu.ph.',
      'College Deans: dean.ccs@, dean.cba@, dean.cahs@, dean.ceas@, dean.chtm@, dean.igs@ gordoncollege.edu.ph.',
      'Office Hours: Monday–Friday, 8:00 AM – 5:00 PM. Closed on weekends.',
      'Address: Olongapo City Sports Complex, Donor St., East Tapinac, Olongapo City 2200.',
    ],
    prompt: 'What are the contact details and office hours at Gordon College?',
  },
]

export default function ExplorePage() {
  const [search, setSearch] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!search.trim()) return CATEGORIES
    const q = search.toLowerCase()
    return CATEGORIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.desc.toLowerCase().includes(q)
    )
  }, [search])

  const handleAskMore = (prompt) => {
    setSelectedCard(null)
    // Navigate to chat with a small delay for animation
    setTimeout(() => {
      navigate('/', { state: { prefill: prompt } })
    }, 200)
  }

  return (
    <div className="explore-page">
      <div className="page-header">
        <h1 className="page-title">Explore</h1>
        <p className="page-subtitle">Browse GC topics & resources</p>
      </div>

      {/* Search */}
      <div className="explore-search">
        <input
          id="explore-search"
          type="text"
          className="explore-search-input"
          placeholder="Search topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <motion.div
          className="explore-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {filtered.map((cat, i) => (
            <motion.div
              key={cat.id}
              className="explore-card"
              id={`card-${cat.id}`}
              onClick={() => setSelectedCard(cat)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="explore-card-icon">
                <cat.icon />
              </div>
              <div className="explore-card-name">{cat.name}</div>
              <div className="explore-card-desc">{cat.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="explore-empty">
          <SearchX />
          <div className="explore-empty-text">No results found</div>
          <div className="explore-empty-hint">Try a different keyword</div>
        </div>
      )}

      {/* Detail Sheet / Modal */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedCard(null)}
          >
            <motion.div
              className="sheet"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className="sheet-title">{selectedCard.name}</div>
              <div className="sheet-body">
                <ul>
                  {selectedCard.info.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="sheet-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedCard(null)}
                >
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAskMore(selectedCard.prompt)}
                >
                  Ask more about this
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
