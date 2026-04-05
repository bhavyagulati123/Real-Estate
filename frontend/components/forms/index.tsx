'use client'
import { useForm } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Label, Select, Textarea, Button, ErrorMsg } from '@/components/ui'
import { useAddLead, useEditLead, useLead, useLeads } from '@/hooks/useLeads'
import { useAddProperty, useEditProperty, useProperties, useCreateDeal, useAddAgent, useAddPayment, useAddInvestment, useAgents as useAgentsData } from '@/hooks/useData'
import { useUIStore } from '@/store/useUIStore'
import { LEAD_SOURCES, PROPERTY_TYPES, CONFIGURATIONS, BLOCKS, DEAL_TYPES, PAYMENT_TYPES, RISK_LEVELS } from '@/lib/utils'
import { useToast } from '@/components/ToastProvider'

// ═══════════════════════════════════════════════════════════════════════════════
// ADD / EDIT LEAD FORM
// ═══════════════════════════════════════════════════════════════════════════════
const leadSchema = z.object({
  name:              z.string().min(1, 'Required'),
  phone:             z.string().min(10, 'Enter valid phone'),
  leadType:          z.enum(['buyer', 'seller']),
  source:            z.enum(['call','whatsapp','agent','walkin','website','referral']),
  budget:            z.coerce.number().optional(),
  location:          z.string().optional(),
  block:             z.string().optional(),
  propertyType:      z.string().optional(),
  configuration:     z.string().optional(),
  size:              z.coerce.number().optional(),
  buildingAge:       z.string().optional(),
  credibilityScore:  z.coerce.number().min(1).max(5).optional(),
  sourceAgentId:     z.string().optional(),
  notes:             z.string().optional(),
})
type LeadForm = z.infer<typeof leadSchema>

export function AddLeadForm({ onClose }: { onClose: () => void }) {
  const { editLeadId } = useUIStore()
  const isEdit = !!editLeadId
  const { data: existing } = useLead(editLeadId || '')
  const addLead  = useAddLead()
  const editLead = useEditLead(editLeadId || '')
  const { data: agentsData } = useAgentsData()
  const agents = agentsData?.data || []
  const toast = useToast()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: isEdit && existing?.data ? {
      ...existing.data,
      source: existing.data.source as LeadForm['source'],
      sourceAgentId: (existing.data.sourceAgentId as any)?._id || '',
    } : { leadType: 'buyer', source: 'call' },
  })

  const watchType = watch('propertyType')

  async function onSubmit(data: LeadForm) {
    try {
      if (isEdit) {
        await editLead.mutateAsync(data as any)
      } else {
        await addLead.mutateAsync(data as any)
      }
      toast.success(isEdit ? 'Lead updated' : 'Lead added')
      onClose()
    } catch (e) {
      toast.error((e as Error).message || 'Something went wrong')
    }
  }

  const isPending = addLead.isPending || editLead.isPending
  const mutError  = addLead.error || editLead.error

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" {...register('name')} error={!!errors.name} placeholder="Rajesh Kumar" />
          <ErrorMsg message={errors.name?.message} />
        </div>

        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" {...register('phone')} error={!!errors.phone} placeholder="+91 98110 00000" />
          <ErrorMsg message={errors.phone?.message} />
        </div>

        <div>
          <Label>Lead type *</Label>
          <Select {...register('leadType')}>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </Select>
        </div>

        <div>
          <Label>Source *</Label>
          <Select {...register('source')}>
            {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>

        <div>
          <Label>Via agent</Label>
          <Select {...register('sourceAgentId')}>
            <option value="">None</option>
            {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </Select>
        </div>

        <div>
          <Label>Budget (₹)</Label>
          <Input type="number" {...register('budget')} placeholder="4500000" />
        </div>

        <div>
          <Label>Location</Label>
          <Input {...register('location')} placeholder="Mohan Garden, Block C" />
        </div>

        <div>
          <Label>Block</Label>
          <Select {...register('block')}>
            <option value="">Any</option>
            {BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
        </div>

        <div>
          <Label>Property type</Label>
          <Select {...register('propertyType')}>
            <option value="">Any</option>
            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>

        {watchType === 'residential' && (
          <div>
            <Label>Configuration</Label>
            <Select {...register('configuration')}>
              <option value="NA">—</option>
              {CONFIGURATIONS.filter(c => c !== 'NA').map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        )}

        <div>
          <Label>Size (sq yd)</Label>
          <Input type="number" {...register('size')} placeholder="100" />
        </div>

        <div>
          <Label>Credibility (1–5)</Label>
          <Input type="number" min={1} max={5} {...register('credibilityScore')} placeholder="3" />
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea {...register('notes')} rows={2} placeholder="Any context about this lead..." />
      </div>

      {mutError && <p className="text-xs text-red-600">{(mutError as Error).message}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={isPending} className="flex-1">
          {isEdit ? 'Save changes' : 'Add lead'}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD / EDIT PROPERTY FORM
// ═══════════════════════════════════════════════════════════════════════════════
const propertySchema = z.object({
  title:               z.string().min(1, 'Required'),
  location:            z.string().min(1, 'Required'),
  block:               z.string().optional(),
  propertyType:        z.string().min(1, 'Required'),
  configuration:       z.string().optional(),
  size:                z.coerce.number().optional(),
  buildingAge:         z.string().optional(),
  buildingCredibility: z.coerce.number().min(1).max(5).optional(),
  floorPrice:          z.coerce.number().optional(),
  askingPrice:         z.coerce.number().optional(),
  listedPrice:         z.coerce.number().optional(),
  dealType:            z.enum(['brokerage','inflated','coInvestment']),
  sellerId:            z.string().optional(),
  sourceAgentId:       z.string().optional(),
  notes:               z.string().optional(),
})
type PropertyForm = z.infer<typeof propertySchema>

export function AddPropertyForm({ onClose }: { onClose: () => void }) {
  const { editPropertyId } = useUIStore()
  const isEdit = !!editPropertyId
  const addProp   = useAddProperty()
  const editProp  = useEditProperty(editPropertyId || '')
  const { data: sellersData } = useLeads({ leadType: 'seller', limit: 100 })
  const { data: agentsData }  = useAgentsData()
  const sellers = sellersData?.data || []
  const agents  = agentsData?.data  || []
  const toast = useToast()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<PropertyForm>({
    resolver: zodResolver(propertySchema),
    defaultValues: { dealType: 'brokerage' },
  })

  const watchType = watch('propertyType')

  async function onSubmit(data: PropertyForm) {
    try {
      if (isEdit) await editProp.mutateAsync(data as any)
      else        await addProp.mutateAsync(data as any)
      toast.success(isEdit ? 'Property updated' : 'Property added')
      onClose()
    } catch (e) {
      toast.error((e as Error).message || 'Something went wrong')
    }
  }

  const isPending = addProp.isPending || editProp.isPending
  const mutError  = addProp.error || editProp.error

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      <div>
        <Label>Title *</Label>
        <Input {...register('title')} error={!!errors.title} placeholder="2BHK Floor, Block C" />
        <ErrorMsg message={errors.title?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Location *</Label>
          <Input {...register('location')} error={!!errors.location} placeholder="Mohan Garden" />
          <ErrorMsg message={errors.location?.message} />
        </div>

        <div>
          <Label>Block</Label>
          <Select {...register('block')}>
            <option value="">—</option>
            {BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
        </div>

        <div>
          <Label>Property type *</Label>
          <Select {...register('propertyType')}>
            <option value="">Select...</option>
            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <ErrorMsg message={errors.propertyType?.message} />
        </div>

        {watchType === 'residential' && (
          <div>
            <Label>Configuration</Label>
            <Select {...register('configuration')}>
              <option value="NA">—</option>
              {CONFIGURATIONS.filter(c => c !== 'NA').map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        )}

        <div>
          <Label>Size (sq yd)</Label>
          <Input type="number" {...register('size')} />
        </div>

        <div>
          <Label>Building age</Label>
          <Input {...register('buildingAge')} placeholder="5 years" />
        </div>

        <div>
          <Label>Deal type *</Label>
          <Select {...register('dealType')}>
            {DEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>

        <div>
          <Label>Building credibility (1–5)</Label>
          <Input type="number" min={1} max={5} {...register('buildingCredibility')} />
        </div>
      </div>

      {/* Pricing section */}
      <fieldset className="border border-zinc-200 rounded-xl p-4 space-y-3">
        <legend className="text-xs font-medium text-zinc-400 uppercase tracking-widest px-1">Pricing</legend>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Floor price (₹)</Label>
            <Input type="number" {...register('floorPrice')} placeholder="Private minimum" />
          </div>
          <div>
            <Label>Asking price (₹)</Label>
            <Input type="number" {...register('askingPrice')} />
          </div>
          <div>
            <Label>Listed price (₹)</Label>
            <Input type="number" {...register('listedPrice')} placeholder="Shown to buyers" />
          </div>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Seller</Label>
          <Select {...register('sellerId')}>
            <option value="">Select seller...</option>
            {sellers.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
        </div>
        <div>
          <Label>Source agent</Label>
          <Select {...register('sourceAgentId')}>
            <option value="">None</option>
            {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </Select>
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea {...register('notes')} rows={2} />
      </div>

      {mutError && <p className="text-xs text-red-600">{(mutError as Error).message}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={isPending} className="flex-1">
          {isEdit ? 'Save changes' : 'Add property'}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD DEAL FORM
// ═══════════════════════════════════════════════════════════════════════════════
const dealSchema = z.object({
  propertyId:            z.string().min(1, 'Required'),
  buyerLeadId:           z.string().min(1, 'Required'),
  sellerLeadId:          z.string().min(1, 'Required'),
  dealType:              z.enum(['brokerage','inflated','coInvestment']),
  agreedPrice:           z.coerce.number().min(1, 'Required'),
  commissionRate:        z.coerce.number().optional(),
  buyerAgentId:          z.string().optional(),
  sellerAgentId:         z.string().optional(),
  commissionSplitPercent:z.coerce.number().optional(),
  riskLevel:             z.enum(['low','medium','high']),
  riskNotes:             z.string().optional(),
})
type DealForm = z.infer<typeof dealSchema>

export function AddDealForm({ onClose }: { onClose: () => void }) {
  const { addDealPropertyId, addDealBuyerLeadId } = useUIStore()
  const createDeal = useCreateDeal()
  const { data: propertiesData } = useProperties({ ownershipStatus: 'available', limit: 100 })
  const { data: buyersData }     = useLeads({ leadType: 'buyer', limit: 100 })
  const { data: sellersData }    = useLeads({ leadType: 'seller', limit: 100 })
  const { data: agentsData }     = useAgentsData()
  const toast = useToast()

  const properties = propertiesData?.data || []
  const buyers     = buyersData?.data     || []
  const sellers    = sellersData?.data    || []
  const agents     = agentsData?.data     || []

  const { register, handleSubmit, formState: { errors } } = useForm<DealForm>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      propertyId:   addDealPropertyId  || '',
      buyerLeadId:  addDealBuyerLeadId || '',
      dealType:     'brokerage',
      riskLevel:    'low',
      commissionRate: 1,
    },
  })

  async function onSubmit(data: DealForm) {
    try {
      await createDeal.mutateAsync(data)
      toast.success('Deal created')
      onClose()
    } catch (e) {
      toast.error((e as Error).message || 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      <div>
        <Label>Property *</Label>
        <Select {...register('propertyId')}>
          <option value="">Select property...</option>
          {properties.map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
        </Select>
        <ErrorMsg message={errors.propertyId?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Buyer *</Label>
          <Select {...register('buyerLeadId')}>
            <option value="">Select buyer...</option>
            {buyers.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </Select>
          <ErrorMsg message={errors.buyerLeadId?.message} />
        </div>

        <div>
          <Label>Seller *</Label>
          <Select {...register('sellerLeadId')}>
            <option value="">Select seller...</option>
            {sellers.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
          <ErrorMsg message={errors.sellerLeadId?.message} />
        </div>

        <div>
          <Label>Deal type *</Label>
          <Select {...register('dealType')}>
            {DEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>

        <div>
          <Label>Risk level</Label>
          <Select {...register('riskLevel')}>
            {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>

        <div>
          <Label>Agreed price (₹) *</Label>
          <Input type="number" {...register('agreedPrice')} error={!!errors.agreedPrice} />
          <ErrorMsg message={errors.agreedPrice?.message} />
        </div>

        <div>
          <Label>Commission rate (%)</Label>
          <Input type="number" step="0.5" {...register('commissionRate')} placeholder="1" />
        </div>

        <div>
          <Label>Buyer's agent</Label>
          <Select {...register('buyerAgentId')}>
            <option value="">None</option>
            {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </Select>
        </div>

        <div>
          <Label>Seller's agent</Label>
          <Select {...register('sellerAgentId')}>
            <option value="">None</option>
            {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </Select>
        </div>
      </div>

      <div>
        <Label>Risk notes</Label>
        <Textarea {...register('riskNotes')} rows={2} placeholder="e.g. Buyer depends on selling own property first" />
      </div>

      {createDeal.error && <p className="text-xs text-red-600">{(createDeal.error as Error).message}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={createDeal.isPending} className="flex-1">Create deal</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD AGENT FORM
// ═══════════════════════════════════════════════════════════════════════════════
const agentSchema = z.object({
  name:  z.string().min(1, 'Required'),
  phone: z.string().optional(),
  type:  z.enum(['internal','external']),
  notes: z.string().optional(),
})
type AgentForm = z.infer<typeof agentSchema>

export function AddAgentForm({ onClose }: { onClose: () => void }) {
  const addAgent = useAddAgent()
  const toast = useToast()
  const { register, handleSubmit, formState: { errors } } = useForm<AgentForm>({
    resolver: zodResolver(agentSchema),
    defaultValues: { type: 'external' },
  })

  async function onSubmit(data: AgentForm) {
    try {
      await addAgent.mutateAsync(data)
      toast.success('Agent added')
      onClose()
    } catch (e) {
      toast.error((e as Error).message || 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Name *</Label>
        <Input {...register('name')} error={!!errors.name} placeholder="Agent name" />
        <ErrorMsg message={errors.name?.message} />
      </div>
      <div>
        <Label>Phone</Label>
        <Input {...register('phone')} placeholder="+91 98110 00000" />
      </div>
      <div>
        <Label>Type *</Label>
        <Select {...register('type')}>
          <option value="external">External collaborator</option>
          <option value="internal">Internal (has login)</option>
        </Select>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea {...register('notes')} rows={2} />
      </div>
      {addAgent.error && <p className="text-xs text-red-600">{(addAgent.error as Error).message}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={addAgent.isPending} className="flex-1">Add agent</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD PAYMENT FORM
// ═══════════════════════════════════════════════════════════════════════════════
const paymentSchema = z.object({
  type:       z.enum(['token','bayana','partPayment','fullPayment','commission']),
  amount:     z.coerce.number().min(1, 'Required'),
  date:       z.string().min(1, 'Required'),
  paidBy:     z.string().optional(),
  receivedBy: z.string().optional(),
  notes:      z.string().optional(),
  verified:   z.boolean().optional(),
})
type PaymentForm = z.infer<typeof paymentSchema>

export function AddPaymentForm({ dealId, onClose }: { dealId: string; onClose: () => void }) {
  const addPayment = useAddPayment(dealId)
  const toast = useToast()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { type: 'token', date: new Date().toISOString().split('T')[0] },
  })

  const watchType = watch('type')

  async function onSubmit(data: PaymentForm) {
    try {
      await addPayment.mutateAsync(data)
      toast.success('Payment recorded')
      onClose()
    } catch (e) {
      toast.error((e as Error).message || 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Payment type *</Label>
          <Select {...register('type')}>
            {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div>
          <Label>Date *</Label>
          <Input type="date" {...register('date')} error={!!errors.date} />
          <ErrorMsg message={errors.date?.message} />
        </div>
        <div className="col-span-2">
          <Label>Amount (₹) *</Label>
          <Input type="number" {...register('amount')} error={!!errors.amount} />
          <ErrorMsg message={errors.amount?.message} />
        </div>
        <div>
          <Label>Paid by</Label>
          <Input {...register('paidBy')} placeholder="Buyer name" />
        </div>
        <div>
          <Label>Received by</Label>
          <Input {...register('receivedBy')} placeholder="Father / agent" />
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea {...register('notes')} rows={2} placeholder="e.g. Via RTGS, cheque pending" />
      </div>

      {watchType === 'commission' && (
        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
          <input type="checkbox" {...register('verified')} className="rounded" />
          Mark commission as received (adds to wealth ledger)
        </label>
      )}

      {addPayment.error && <p className="text-xs text-red-600">{(addPayment.error as Error).message}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={addPayment.isPending} className="flex-1">Record payment</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// ADD INVESTMENT FORM
// ═════════════════════════════════════════════════════════════════════════════
const coInvestorSchema = z.object({
  name:           z.string().min(1, 'Required'),
  phone:          z.string().optional(),
  amountInvested: z.coerce.number().min(1, 'Required'),
  sharePercent:   z.coerce.number().min(1, 'Required'),
})

const investmentSchema = z.object({
  propertyId:      z.string().min(1, 'Required'),
  purchasePrice:   z.coerce.number().min(1, 'Required'),
  purchaseDate:    z.string().min(1, 'Required'),
  mySharePercent:  z.coerce.number().min(1, 'Required').max(100, 'Max 100'),
  holdingCosts:    z.coerce.number().optional(),
  targetSalePrice: z.coerce.number().optional(),
  notes:           z.string().optional(),
  coInvestors:     z.array(coInvestorSchema).optional(),
})
type InvestmentForm = z.infer<typeof investmentSchema>

export function AddInvestmentForm({ onClose }: { onClose: () => void }) {
  const toast = useToast()
  const addInvestment = useAddInvestment()
  const { data: propertiesData } = useProperties({ limit: 200 })
  const properties = propertiesData?.data || []

  const { register, control, handleSubmit, formState: { errors } } = useForm<InvestmentForm>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      purchaseDate: new Date().toISOString().split('T')[0],
      mySharePercent: 100,
      holdingCosts: 0,
      coInvestors: [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'coInvestors' })

  async function onSubmit(data: InvestmentForm) {
    try {
      await addInvestment.mutateAsync({
        ...data,
        coInvestors: data.coInvestors?.filter((c) => c.name?.trim()) ?? [],
      })
      toast.success('Investment added')
      onClose()
    } catch (e) {
      toast.error((e as Error).message || 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Property *</Label>
        <Select {...register('propertyId')}>
          <option value="">Select property...</option>
          {properties.map((p: any) => (
            <option key={p._id} value={p._id}>
              {p.title}{p.location ? ` — ${p.location}` : ''}
            </option>
          ))}
        </Select>
        <ErrorMsg message={errors.propertyId?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Purchase date *</Label>
          <Input type="date" {...register('purchaseDate')} error={!!errors.purchaseDate} />
          <ErrorMsg message={errors.purchaseDate?.message} />
        </div>
        <div>
          <Label>My share (%) *</Label>
          <Input type="number" step="0.5" {...register('mySharePercent')} error={!!errors.mySharePercent} />
          <ErrorMsg message={errors.mySharePercent?.message} />
        </div>
        <div className="col-span-2">
          <Label>Purchase price (₹) *</Label>
          <Input type="number" {...register('purchasePrice')} error={!!errors.purchasePrice} />
          <ErrorMsg message={errors.purchasePrice?.message} />
        </div>
        <div>
          <Label>Holding costs (₹)</Label>
          <Input type="number" {...register('holdingCosts')} />
        </div>
        <div>
          <Label>Target sale price (₹)</Label>
          <Input type="number" {...register('targetSalePrice')} />
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea {...register('notes')} rows={2} />
      </div>

      <div className="rounded-xl border border-zinc-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-zinc-700">Co-investors</p>
          <Button type="button" size="sm" variant="secondary" onClick={() => append({ name: '', phone: '', amountInvested: 0 as any, sharePercent: 0 as any })}>
            + Add
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-xs text-zinc-500">Optional — add partners if any.</p>
        ) : (
          <div className="space-y-3">
            {fields.map((f, idx) => (
              <div key={f.id} className="rounded-lg border border-zinc-200 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Name *</Label>
                    <Input {...register(`coInvestors.${idx}.name` as const)} error={!!errors.coInvestors?.[idx]?.name} />
                    <ErrorMsg message={errors.coInvestors?.[idx]?.name?.message as any} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input {...register(`coInvestors.${idx}.phone` as const)} />
                  </div>
                  <div>
                    <Label>Amount (₹) *</Label>
                    <Input type="number" {...register(`coInvestors.${idx}.amountInvested` as const)} error={!!errors.coInvestors?.[idx]?.amountInvested} />
                    <ErrorMsg message={errors.coInvestors?.[idx]?.amountInvested?.message as any} />
                  </div>
                  <div>
                    <Label>Share (%) *</Label>
                    <Input type="number" step="0.5" {...register(`coInvestors.${idx}.sharePercent` as const)} error={!!errors.coInvestors?.[idx]?.sharePercent} />
                    <ErrorMsg message={errors.coInvestors?.[idx]?.sharePercent?.message as any} />
                  </div>
                </div>
                <div className="pt-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => remove(idx)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {addInvestment.error && <p className="text-xs text-red-600">{(addInvestment.error as Error).message}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={addInvestment.isPending} className="flex-1">Add investment</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  )
}
