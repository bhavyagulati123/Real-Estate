'use client'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar, MobileNav } from '@/components/Navigation'
import { Sheet } from '@/components/ui'
import { AddLeadForm, AddPropertyForm, AddDealForm, AddPaymentForm } from '@/components/forms'
import { useUIStore } from '@/store/useUIStore'
import { pageVariants } from '@/lib/motion'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const {
    addLeadOpen,     closeAddLead,
    editLeadId,      closeEditLead,
    addPropertyOpen, closeAddProperty,
    editPropertyId,  closeEditProperty,
    addDealOpen,     closeAddDeal,
    addPaymentDealId,closeAddPayment,
  } = useUIStore()

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />

      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          variants={pageVariants}
          initial="initial" animate="animate" exit="exit"
          className="flex-1 overflow-auto pb-16 md:pb-0"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <MobileNav />

      {/* ── Global sheets ───────────────────────────────────────────────── */}
      <Sheet open={addLeadOpen || !!editLeadId} onClose={editLeadId ? closeEditLead : closeAddLead}
             title={editLeadId ? 'Edit lead' : 'Add lead'}>
        <AddLeadForm onClose={editLeadId ? closeEditLead : closeAddLead} />
      </Sheet>

      <Sheet open={addPropertyOpen || !!editPropertyId} onClose={editPropertyId ? closeEditProperty : closeAddProperty}
             title={editPropertyId ? 'Edit property' : 'Add property'}>
        <AddPropertyForm onClose={editPropertyId ? closeEditProperty : closeAddProperty} />
      </Sheet>

      <Sheet open={addDealOpen} onClose={closeAddDeal} title="Create deal">
        <AddDealForm onClose={closeAddDeal} />
      </Sheet>

      {addPaymentDealId && (
        <Sheet open={!!addPaymentDealId} onClose={closeAddPayment} title="Record payment">
          <AddPaymentForm dealId={addPaymentDealId} onClose={closeAddPayment} />
        </Sheet>
      )}
    </div>
  )
}
