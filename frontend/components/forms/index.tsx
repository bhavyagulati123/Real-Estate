'use client'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Label, Select, Textarea, Button, ErrorMsg } from '@/components/ui'
import { useAddLead, useEditLead, useLead, useLeads } from '@/hooks/useLeads'
import { useAddProperty, useEditProperty, useProperties, useCreateDeal, useAddPayment, useAddInvestment } from '@/hooks/useData'
import { useUIStore } from '@/store/useUIStore'
import { LEAD_SOURCES, PROPERTY_TYPES, CONFIGURATIONS, BLOCKS, DEAL_TYPES, PAYMENT_TYPES, RISK_LEVELS, formatRupees } from '@/lib/utils'
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
  notes:             z.string().optional(),
})
type LeadForm = z.infer<typeof leadSchema>

export function AddLeadForm({ onClose }: { onClose: () => void }) {
  const { editLeadId } = useUIStore()
  const isEdit = !!editLeadId
  const { data: existing } = useLead(editLeadId || '')
  const addLead  = useAddLead()
  const editLead = useEditLead(editLeadId || '')
  const toast = useToast()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: isEdit && existing?.data ? {
      ...existing.data,
      source: existing.data.source as LeadForm['source'],
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
          <Input id="name" {...register('name')} autoComplete="name" error={!!errors.name} placeholder="Rajesh Kumar" />
          <ErrorMsg message={errors.name?.message} />
        </div>

        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" type="tel" {...register('phone')} autoComplete="tel" error={!!errors.phone} placeholder="+91 98110 00000" />
          <ErrorMsg message={errors.phone?.message} />
        </div>

        {isEdit && (
          <div>
            <Label htmlFor="leadType">Lead type</Label>
            <Select id="leadType" autoComplete="off" {...register('leadType')}>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="source">Source *</Label>
          <Select id="source" autoComplete="off" {...register('source')}>
            {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>

        <div>
          <Label htmlFor="budget">Budget (₹)</Label>
          <Input id="budget" type="number" {...register('budget')} autoComplete="off" placeholder="4500000" />
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register('location')} autoComplete="off" placeholder="Mohan Garden, Block C" />
        </div>

        <div>
          <Label htmlFor="block">Block</Label>
          <Select id="block" autoComplete="off" {...register('block')}>
            <option value="">Any</option>
            {BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
        </div>

        <div>
          <Label htmlFor="propertyType">Property type</Label>
          <Select id="propertyType" autoComplete="off" {...register('propertyType')}>
            <option value="">Any</option>
            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>

        {watchType === 'residential' && (
          <div>
            <Label htmlFor="configuration">Configuration</Label>
            <Select id="configuration" autoComplete="off" {...register('configuration')}>
              <option value="NA">—</option>
              {CONFIGURATIONS.filter(c => c !== 'NA').map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="size">Size (sq yd)</Label>
          <Input id="size" type="number" {...register('size')} autoComplete="off" placeholder="100" />
        </div>

        <div>
          <Label htmlFor="credibilityScore">Credibility (1–5)</Label>
          <Input id="credibilityScore" type="number" min={1} max={5} {...register('credibilityScore')} autoComplete="off" placeholder="3" />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} autoComplete="off" rows={2} placeholder="Any context about this lead..." />
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
  notes:               z.string().optional(),
})
type PropertyForm = z.infer<typeof propertySchema>

const newSellerSchema = z.object({
  name:   z.string().min(1, 'Required'),
  phone:  z.string().min(10, 'Enter valid phone'),
  source: z.enum(['call','whatsapp','agent','walkin','website','referral']),
})
type NewSellerForm = z.infer<typeof newSellerSchema>

export function AddPropertyForm({ onClose }: { onClose: () => void }) {
  const { editPropertyId } = useUIStore()
  const isEdit = !!editPropertyId
  const addProp  = useAddProperty()
  const editProp = useEditProperty(editPropertyId || '')
  const addLead  = useAddLead()
  const { data: sellersData } = useLeads({ limit: 200 })
  const allLeads = sellersData?.data || []
  const toast = useToast()

  const [sellerMode, setSellerMode] = useState<'existing' | 'new'>('existing')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<PropertyForm>({
    resolver: zodResolver(propertySchema),
    defaultValues: { dealType: 'brokerage' },
  })

  const {
    register: regSeller,
    handleSubmit: handleSellerSubmit,
    formState: { errors: sellerErrors },
  } = useForm<NewSellerForm>({
    resolver: zodResolver(newSellerSchema),
    defaultValues: { source: 'call' },
  })

  const watchType = watch('propertyType')

  async function onSubmit(data: PropertyForm) {
    try {
      if (isEdit) {
        await editProp.mutateAsync(data as any)
      } else {
        await addProp.mutateAsync(data as any)
      }
      toast.success(isEdit ? 'Property updated' : 'Property added')
      onClose()
    } catch (e) {
      toast.error((e as Error).message || 'Something went wrong')
    }
  }

  async function onSubmitWithNewSeller(propData: PropertyForm, sellerData: NewSellerForm) {
    try {
      const newLead = await addLead.mutateAsync({
        ...sellerData,
        leadType: 'seller',
      } as any)
      const sellerId = (newLead as any)?.data?._id
      await addProp.mutateAsync({ ...propData, sellerId } as any)
      toast.success('Property and seller added')
      onClose()
    } catch (e) {
      toast.error((e as Error).message || 'Something went wrong')
    }
  }

  function handleFormSubmit(propData: PropertyForm) {
    if (sellerMode === 'new') {
      handleSellerSubmit((sellerData) => onSubmitWithNewSeller(propData, sellerData))()
    } else {
      onSubmit(propData)
    }
  }

  const isPending = addProp.isPending || editProp.isPending || addLead.isPending
  const mutError  = addProp.error || editProp.error

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">

      <div>
        <Label htmlFor="property_title">Title *</Label>
        <Input id="property_title" {...register('title')} autoComplete="off" error={!!errors.title} placeholder="2BHK Floor, Block C" />
        <ErrorMsg message={errors.title?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="property_location">Location *</Label>
          <Input id="property_location" {...register('location')} autoComplete="off" error={!!errors.location} placeholder="Mohan Garden" />
          <ErrorMsg message={errors.location?.message} />
        </div>

        <div>
          <Label htmlFor="property_block">Block</Label>
          <Select id="property_block" autoComplete="off" {...register('block')}>
            <option value="">—</option>
            {BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
        </div>

        <div>
          <Label htmlFor="property_type">Property type *</Label>
          <Select id="property_type" autoComplete="off" {...register('propertyType')}>
            <option value="">Select...</option>
            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <ErrorMsg message={errors.propertyType?.message} />
        </div>

        {watchType === 'residential' && (
          <div>
            <Label htmlFor="property_configuration">Configuration</Label>
            <Select id="property_configuration" autoComplete="off" {...register('configuration')}>
              <option value="NA">—</option>
              {CONFIGURATIONS.filter(c => c !== 'NA').map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="property_size">Size (sq yd)</Label>
          <Input id="property_size" type="number" {...register('size')} autoComplete="off" />
        </div>

        <div>
          <Label htmlFor="property_buildingAge">Building age</Label>
          <Input id="property_buildingAge" {...register('buildingAge')} autoComplete="off" placeholder="5 years" />
        </div>

        <div>
          <Label htmlFor="property_dealType">Deal type *</Label>
          <Select id="property_dealType" autoComplete="off" {...register('dealType')}>
            {DEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>

        <div>
          <Label htmlFor="property_buildingCredibility">Building credibility (1–5)</Label>
          <Input id="property_buildingCredibility" type="number" min={1} max={5} {...register('buildingCredibility')} autoComplete="off" />
        </div>
      </div>

      {/* Pricing section */}
      <fieldset className="border border-zinc-200 rounded-xl p-4 space-y-3">
        <legend className="text-xs font-medium text-zinc-400 uppercase tracking-widest px-1">Pricing</legend>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="property_floorPrice">Floor price (₹)</Label>
            <Input id="property_floorPrice" type="number" {...register('floorPrice')} autoComplete="off" placeholder="Private minimum" />
          </div>
          <div>
            <Label htmlFor="property_askingPrice">Asking price (₹)</Label>
            <Input id="property_askingPrice" type="number" {...register('askingPrice')} autoComplete="off" />
          </div>
          <div>
            <Label htmlFor="property_listedPrice">Listed price (₹)</Label>
            <Input id="property_listedPrice" type="number" {...register('listedPrice')} autoComplete="off" placeholder="Shown to buyers" />
          </div>
        </div>
      </fieldset>

      {/* Seller section */}
      {!isEdit && (
        <fieldset className="border border-zinc-200 rounded-xl p-4 space-y-3">
          <legend className="text-xs font-medium text-zinc-400 uppercase tracking-widest px-1">Seller / Owner</legend>

          <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => setSellerMode('existing')}
              className={`flex-1 py-1.5 text-center transition-colors ${sellerMode === 'existing' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
            >
              Existing person
            </button>
            <button
              type="button"
              onClick={() => setSellerMode('new')}
              className={`flex-1 py-1.5 text-center transition-colors ${sellerMode === 'new' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
            >
              New person
            </button>
          </div>

          {sellerMode === 'existing' ? (
            <div>
              <Label htmlFor="property_sellerId">Select person</Label>
              <Select id="property_sellerId" autoComplete="off" {...register('sellerId')}>
                <option value="">— None —</option>
                {allLeads.map((l: any) => (
                  <option key={l._id} value={l._id}>
                    {l.name} · {l.phone} {l.leadType === 'buyer' ? '(buyer)' : ''}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="new_seller_name">Name *</Label>
                <Input id="new_seller_name" {...regSeller('name')} autoComplete="name" error={!!sellerErrors.name} placeholder="Owner name" />
                <ErrorMsg message={sellerErrors.name?.message} />
              </div>
              <div>
                <Label htmlFor="new_seller_phone">Phone *</Label>
                <Input id="new_seller_phone" type="tel" {...regSeller('phone')} autoComplete="tel" error={!!sellerErrors.phone} placeholder="+91 98110 00000" />
                <ErrorMsg message={sellerErrors.phone?.message} />
              </div>
              <div>
                <Label htmlFor="new_seller_source">How did they contact? *</Label>
                <Select id="new_seller_source" autoComplete="off" {...regSeller('source')}>
                  {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <p className="col-span-2 text-xs text-zinc-400">A new seller lead will be created automatically.</p>
            </div>
          )}
        </fieldset>
      )}

      <div>
        <Label htmlFor="property_notes">Notes</Label>
        <Textarea id="property_notes" {...register('notes')} autoComplete="off" rows={2} />
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
  propertyId:   z.string().min(1, 'Required'),
  buyerLeadId:  z.string().min(1, 'Required'),
  sellerLeadId: z.string().min(1, 'Required'),
  dealType:     z.enum(['brokerage','inflated','coInvestment']),
  agreedPrice:  z.coerce.number().min(1, 'Required'),
  commissionRate: z.coerce.number().optional(),
  riskLevel:    z.enum(['low','medium','high']),
  riskNotes:    z.string().optional(),
})
type DealForm = z.infer<typeof dealSchema>

export function AddDealForm({ onClose }: { onClose: () => void }) {
  const { addDealPropertyId, addDealBuyerLeadId } = useUIStore()
  const createDeal = useCreateDeal()
  const { data: propertiesData } = useProperties({ ownershipStatus: 'available', limit: 100 })
  const { data: buyersData }     = useLeads({ leadType: 'buyer', limit: 100 })
  const { data: sellersData }    = useLeads({ leadType: 'seller', limit: 100 })
  const toast = useToast()

  const properties = propertiesData?.data || []
  const buyers     = buyersData?.data     || []
  const sellers    = sellersData?.data    || []

  const { register, handleSubmit, formState: { errors } } = useForm<DealForm>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      propertyId:     addDealPropertyId  || '',
      buyerLeadId:    addDealBuyerLeadId || '',
      dealType:       'brokerage',
      riskLevel:      'low',
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
        <Label htmlFor="deal_propertyId">Property *</Label>
        <Select id="deal_propertyId" autoComplete="off" {...register('propertyId')}>
          <option value="">Select property...</option>
          {properties.map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
        </Select>
        <ErrorMsg message={errors.propertyId?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="deal_buyerLeadId">Buyer *</Label>
          <Select id="deal_buyerLeadId" autoComplete="off" {...register('buyerLeadId')}>
            <option value="">Select buyer...</option>
            {buyers.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </Select>
          <ErrorMsg message={errors.buyerLeadId?.message} />
        </div>

        <div>
          <Label htmlFor="deal_sellerLeadId">Seller *</Label>
          <Select id="deal_sellerLeadId" autoComplete="off" {...register('sellerLeadId')}>
            <option value="">Select seller...</option>
            {sellers.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
          <ErrorMsg message={errors.sellerLeadId?.message} />
        </div>

        <div>
          <Label htmlFor="deal_dealType">Deal type *</Label>
          <Select id="deal_dealType" autoComplete="off" {...register('dealType')}>
            {DEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>

        <div>
          <Label htmlFor="deal_riskLevel">Risk level</Label>
          <Select id="deal_riskLevel" autoComplete="off" {...register('riskLevel')}>
            {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>

        <div>
          <Label htmlFor="deal_agreedPrice">Agreed price (₹) *</Label>
          <Input id="deal_agreedPrice" type="number" {...register('agreedPrice')} autoComplete="off" error={!!errors.agreedPrice} />
          <ErrorMsg message={errors.agreedPrice?.message} />
        </div>

        <div>
          <Label htmlFor="deal_commissionRate">Commission rate (%)</Label>
          <Input id="deal_commissionRate" type="number" step="0.5" {...register('commissionRate')} autoComplete="off" placeholder="1" />
        </div>
      </div>

      <div>
        <Label htmlFor="deal_riskNotes">Risk notes</Label>
        <Textarea id="deal_riskNotes" {...register('riskNotes')} autoComplete="off" rows={2} placeholder="e.g. Buyer depends on selling own property first" />
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
          <Label htmlFor="payment_type">Payment type *</Label>
          <Select id="payment_type" autoComplete="off" {...register('type')}>
            {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="payment_date">Date *</Label>
          <Input id="payment_date" type="date" {...register('date')} autoComplete="off" error={!!errors.date} />
          <ErrorMsg message={errors.date?.message} />
        </div>
        <div className="col-span-2">
          <Label htmlFor="payment_amount">Amount (₹) *</Label>
          <Input id="payment_amount" type="number" {...register('amount')} autoComplete="off" error={!!errors.amount} />
          <ErrorMsg message={errors.amount?.message} />
        </div>
        <div>
          <Label htmlFor="payment_paidBy">Paid by</Label>
          <Input id="payment_paidBy" {...register('paidBy')} autoComplete="name" placeholder="Buyer name" />
        </div>
        <div>
          <Label htmlFor="payment_receivedBy">Received by</Label>
          <Input id="payment_receivedBy" {...register('receivedBy')} autoComplete="name" placeholder="Father / agent" />
        </div>
      </div>

      <div>
        <Label htmlFor="payment_notes">Notes</Label>
        <Textarea id="payment_notes" {...register('notes')} autoComplete="off" rows={2} placeholder="e.g. Via RTGS, cheque pending" />
      </div>

      {watchType === 'commission' && (
        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
          <input id="payment_verified" type="checkbox" {...register('verified')} className="rounded" />
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
  name:         z.string().min(1, 'Required'),
  phone:        z.string().optional(),
  sharePercent: z.coerce.number().min(0.1, 'Required'),
  notes:        z.string().optional(),
})

const investmentSchema = z.object({
  propertyId:      z.string().min(1, 'Required'),
  purchasePrice:   z.coerce.number().min(1, 'Required'),
  purchaseDate:    z.string().min(1, 'Required'),
  mySharePercent:  z.coerce.number().min(0.1, 'Required').max(100, 'Max 100'),
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
      purchaseDate:  new Date().toISOString().split('T')[0],
      mySharePercent: 100,
      holdingCosts:  0,
      coInvestors:   [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'coInvestors' })

  // Watch live values for auto-calculations
  const watchedPrice       = useWatch({ control, name: 'purchasePrice' })
  const watchedMyShare     = useWatch({ control, name: 'mySharePercent' })
  const watchedCoInvestors = useWatch({ control, name: 'coInvestors' }) || []

  const purchasePrice     = Number(watchedPrice)  || 0
  const mySharePct        = Number(watchedMyShare) || 0
  const myAmount          = purchasePrice > 0 ? Math.round(purchasePrice * mySharePct / 100) : 0
  const totalCoShare      = watchedCoInvestors.reduce((s, c) => s + (Number(c?.sharePercent) || 0), 0)
  const totalAllocated    = mySharePct + totalCoShare

  async function onSubmit(data: InvestmentForm) {
    try {
      const price = Number(data.purchasePrice)
      // Auto-calculate amountInvested for each co-investor from their share %
      const enriched = (data.coInvestors || [])
        .filter(c => c.name?.trim())
        .map(c => ({ ...c, amountInvested: Math.round(price * Number(c.sharePercent) / 100) }))

      await addInvestment.mutateAsync({ ...data, coInvestors: enriched } as any)
      toast.success('Investment added')
      onClose()
    } catch (e) {
      toast.error((e as Error).message || 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      <p className="text-xs text-zinc-400 rounded-lg bg-zinc-50 px-3 py-2">
        For properties you own outright or co-own. Commission from brokerage deals is tracked on the deal page.
      </p>

      <div>
        <Label htmlFor="investment_propertyId">Property *</Label>
        <Select id="investment_propertyId" autoComplete="off" {...register('propertyId')}>
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
        <div className="col-span-2">
          <Label htmlFor="investment_purchasePrice">Total purchase price (₹) *</Label>
          <Input id="investment_purchasePrice" type="number" {...register('purchasePrice')} autoComplete="off" error={!!errors.purchasePrice} />
          <ErrorMsg message={errors.purchasePrice?.message} />
        </div>
        <div>
          <Label htmlFor="investment_purchaseDate">Purchase date *</Label>
          <Input id="investment_purchaseDate" type="date" {...register('purchaseDate')} autoComplete="off" error={!!errors.purchaseDate} />
          <ErrorMsg message={errors.purchaseDate?.message} />
        </div>
        <div>
          <Label htmlFor="investment_mySharePercent">My ownership (%) *</Label>
          <Input id="investment_mySharePercent" type="number" step="0.5" {...register('mySharePercent')} autoComplete="off" error={!!errors.mySharePercent} placeholder="e.g. 60" />
          <ErrorMsg message={errors.mySharePercent?.message} />
        </div>
        <div>
          <Label htmlFor="investment_holdingCosts">Holding costs (₹)</Label>
          <Input id="investment_holdingCosts" type="number" {...register('holdingCosts')} autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="investment_targetSalePrice">Target sale price (₹)</Label>
          <Input id="investment_targetSalePrice" type="number" {...register('targetSalePrice')} autoComplete="off" />
        </div>
      </div>

      {/* Live share summary */}
      {purchasePrice > 0 && (
        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 flex gap-4 flex-wrap">
          <span>Your investment: <strong>{formatRupees(myAmount)}</strong> ({mySharePct}%)</span>
          {totalCoShare > 0 && <span>Co-investors: <strong>{totalCoShare.toFixed(1)}%</strong></span>}
          {Math.abs(totalAllocated - 100) > 0.5 && (
            <span className="text-amber-700 font-medium">
              ⚠ {totalAllocated > 100 ? `Over-allocated by ${(totalAllocated - 100).toFixed(1)}%` : `Unallocated: ${(100 - totalAllocated).toFixed(1)}%`}
            </span>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="investment_notes">Notes</Label>
        <Textarea id="investment_notes" {...register('notes')} autoComplete="off" rows={2} />
      </div>

      {/* Co-investors */}
      <div className="rounded-xl border border-zinc-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-zinc-700">Co-investors</p>
          <Button type="button" size="sm" variant="secondary" onClick={() => append({ name: '', phone: '', sharePercent: 0 as any })}>
            + Add
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-xs text-zinc-500">Optional — add partners who co-own this property.</p>
        ) : (
          <div className="space-y-3">
            {fields.map((f, idx) => {
              const coShare = Number(watchedCoInvestors[idx]?.sharePercent) || 0
              const coAmt   = purchasePrice > 0 ? Math.round(purchasePrice * coShare / 100) : 0
              return (
                <div key={f.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor={`coinvestor_${idx}_name`}>Name *</Label>
                      <Input id={`coinvestor_${idx}_name`} {...register(`coInvestors.${idx}.name` as const)} autoComplete="name" error={!!errors.coInvestors?.[idx]?.name} />
                      <ErrorMsg message={errors.coInvestors?.[idx]?.name?.message as any} />
                    </div>
                    <div>
                      <Label htmlFor={`coinvestor_${idx}_phone`}>Phone</Label>
                      <Input id={`coinvestor_${idx}_phone`} type="tel" {...register(`coInvestors.${idx}.phone` as const)} autoComplete="tel" />
                    </div>
                    <div>
                      <Label htmlFor={`coinvestor_${idx}_sharePercent`}>Their share (%) *</Label>
                      <Input id={`coinvestor_${idx}_sharePercent`} type="number" step="0.5" {...register(`coInvestors.${idx}.sharePercent` as const)} autoComplete="off" error={!!errors.coInvestors?.[idx]?.sharePercent} />
                      <ErrorMsg message={errors.coInvestors?.[idx]?.sharePercent?.message as any} />
                    </div>
                  </div>
                  {coAmt > 0 && (
                    <p className="text-xs text-zinc-500 mt-2">
                      Their amount: <strong>{formatRupees(coAmt)}</strong> (auto-calculated)
                    </p>
                  )}
                  <div className="pt-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => remove(idx)}>Remove</Button>
                  </div>
                </div>
              )
            })}
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
