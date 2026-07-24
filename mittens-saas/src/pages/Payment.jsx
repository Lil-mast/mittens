import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function Payment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState(searchParams.get('plan') || 'pro')

  const priceId = plan === 'pro' ? 'price_pro_monthly' : 'price_pro_yearly'
  const amount = plan === 'pro' ? '$4/mo' : '$40/yr'

  const handlePaystackPayment = async () => {
    setLoading(true)
    try {
      const res = await api.post('/payments/checkout', { priceId: plan })
      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url
      } else {
        toast.error('Failed to initialize payment')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment failed. Try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = async () => {
    const reference = searchParams.get('reference')
    if (reference) {
      setLoading(true)
      try {
        await api.post('/payments/verify', { reference })
        toast.success('Payment successful! Welcome to Mittens Pro.')
        navigate('/dashboard')
      } catch {
        toast.error('Could not verify payment. Contact support.')
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    handleSuccess()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-serif italic text-4xl text-white mb-2">Payment</h1>
          <p className="text-muted">Upgrade to Mittens Pro</p>
        </div>

        <div className="card-glow rounded-2xl p-8 bg-surface">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Mittens Pro</span>
              <span className="text-accent font-semibold">{amount}</span>
            </div>
            <div className="text-sm text-muted">
              Nova Pro model · Full agentic features · Cancel anytime
            </div>
          </div>

          <div className="section-divider mb-6" />

          <ul className="space-y-3 mb-8">
            {[
              'Nova Pro model (full reasoning)',
              'Gmail read + modify access',
              'MCP agentic functions',
              '6-category email classification',
              'Security alert priority notifications',
              'Daily reports via ntfy.sh',
              'Sender familiarity tagging',
              'Custom query intervals',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-white">
                <span className="text-accent text-xs">◆</span>
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={handlePaystackPayment}
            disabled={loading}
            className="w-full btn-primary py-4 text-base"
          >
            {loading ? 'Redirecting to Paystack...' : `Pay ${amount} with Paystack`}
          </button>

          <p className="mt-4 text-center text-xs text-muted">
            Secure payment via Paystack. You'll be redirected to complete payment.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <a href="/pricing" className="text-accent hover:underline">
            ← Back to pricing
          </a>
        </p>
      </div>
    </div>
  )
}