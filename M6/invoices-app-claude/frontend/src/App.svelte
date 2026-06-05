<script lang="ts">
  import { onMount } from 'svelte'

  interface Invoice {
    _id: string
    number: string
    client: string
    amount: number
    date: string
    status: 'paid' | 'pending' | 'overdue'
  }

  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  let invoices: Invoice[] = []
  let loading = false
  let fromCache = false
  let submitting = false
  let error = ''

  let form = { number: '', client: '', amount: '', status: 'pending' }

  async function fetchInvoices() {
    loading = true
    error = ''
    try {
      const res = await fetch(`${API}/invoices`)
      const json = await res.json()
      invoices = json.data
      fromCache = json.cached
    } catch {
      error = 'Failed to load invoices'
    } finally {
      loading = false
    }
  }

  async function submit(e: Event) {
    e.preventDefault()
    submitting = true
    error = ''
    try {
      const res = await fetch(`${API}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: form.number,
          client: form.client,
          amount: Number(form.amount),
          status: form.status
        })
      })
      if (!res.ok) throw new Error('Failed to add invoice')
      form = { number: '', client: '', amount: '', status: 'pending' }
      await fetchInvoices()
    } catch {
      error = 'Failed to add invoice'
    } finally {
      submitting = false
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB')
  const formatAmount = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  onMount(fetchInvoices)
</script>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0 }
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    min-height: 100vh;
  }

  .container { max-width: 1000px; margin: 0 auto; padding: 2rem 1rem }

  header { margin-bottom: 2rem }
  h1 { font-size: 1.75rem; font-weight: 700; color: #f8fafc }
  .subtitle { color: #475569; font-size: 0.875rem; margin-top: 0.25rem }

  .layout { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items: start }

  .card {
    background: #1e293b;
    border-radius: 0.75rem;
    border: 1px solid #334155;
    overflow: hidden;
  }

  .card-header {
    padding: 0.875rem 1.25rem;
    border-bottom: 1px solid #334155;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .cache-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.6rem;
    border-radius: 9999px;
    background: #1e3a5f;
    color: #7dd3fc;
    font-weight: 500;
  }

  table { width: 100%; border-collapse: collapse }
  th {
    padding: 0.625rem 1.25rem;
    text-align: left;
    font-size: 0.7rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: #162032;
  }
  td { padding: 0.8rem 1.25rem; border-top: 1px solid #1e2d40; font-size: 0.875rem }
  tr:hover td { background: #162032 }

  .badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: capitalize;
  }
  .badge-paid    { background: #14532d; color: #86efac }
  .badge-pending { background: #713f12; color: #fde68a }
  .badge-overdue { background: #7f1d1d; color: #fca5a5 }

  .amount { font-family: 'SF Mono', 'Fira Code', monospace; color: #a5b4fc }
  .client { color: #cbd5e1 }
  .num { color: #94a3b8; font-size: 0.8rem }

  .empty { padding: 3rem 1.25rem; text-align: center; color: #475569; font-size: 0.875rem }

  form { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.875rem }

  .field label {
    display: block;
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.35rem;
    font-weight: 500;
  }

  input, select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    color: #e2e8f0;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.15s;
  }
  input:focus, select:focus { border-color: #6366f1 }
  input::placeholder { color: #475569 }
  select option { background: #1e293b }

  button {
    width: 100%;
    padding: 0.625rem;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    margin-top: 0.25rem;
  }
  button:hover:not(:disabled) { background: #4f46e5 }
  button:disabled { opacity: 0.5; cursor: not-allowed }

  .error { padding: 0.625rem 1.25rem; font-size: 0.8rem; color: #fca5a5; background: #3b0000; border-top: 1px solid #7f1d1d }

  @media (max-width: 700px) {
    .layout { grid-template-columns: 1fr }
  }
</style>

<div class="container">
  <header>
    <h1>Invoices Dashboard</h1>
    <p class="subtitle">MongoDB · Redis cache · Express API</p>
  </header>

  <div class="layout">
    <div class="card">
      <div class="card-header">
        <span class="card-title">Invoices ({invoices.length})</span>
        {#if fromCache}<span class="cache-badge">from cache</span>{/if}
      </div>

      {#if error}
        <p class="error">{error}</p>
      {/if}

      {#if loading}
        <p class="empty">Loading...</p>
      {:else if invoices.length === 0}
        <p class="empty">No invoices yet. Add one on the right.</p>
      {:else}
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {#each invoices as inv (inv._id)}
              <tr>
                <td class="num">{inv.number}</td>
                <td class="client">{inv.client}</td>
                <td class="amount">{formatAmount(inv.amount)}</td>
                <td class="num">{formatDate(inv.date)}</td>
                <td>
                  <span class="badge badge-{inv.status}">{inv.status}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">New Invoice</span>
      </div>
      <form on:submit={submit}>
        <div class="field">
          <label for="number">Invoice #</label>
          <input id="number" bind:value={form.number} placeholder="INV-001" required />
        </div>
        <div class="field">
          <label for="client">Client</label>
          <input id="client" bind:value={form.client} placeholder="Acme Corp" required />
        </div>
        <div class="field">
          <label for="amount">Amount (USD)</label>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            bind:value={form.amount}
            placeholder="1000.00"
            required
          />
        </div>
        <div class="field">
          <label for="status">Status</label>
          <select id="status" bind:value={form.status}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Invoice'}
        </button>
      </form>
    </div>
  </div>
</div>
