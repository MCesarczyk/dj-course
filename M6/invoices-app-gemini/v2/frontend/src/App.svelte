<script lang="ts">
  import { onMount } from 'svelte';

  let invoices: any[] = [];
  let clientName = '';
  let amount = 0;
  let loading = true;

  async function fetchInvoices() {
    const res = await fetch('http://localhost:3000/invoices');
    invoices = await res.json();
    loading = false;
  }

  async function addInvoice() {
    if (!clientName || amount <= 0) return;
    await fetch('http://localhost:3000/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName, amount })
    });
    clientName = '';
    amount = 0;
    fetchInvoices();
  }

  onMount(fetchInvoices);
</script>

<main class="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
  <div class="max-w-3xl mx-auto">
    <header class="mb-12 border-b border-slate-800 pb-6">
      <h1 class="text-3xl font-bold text-white tracking-tight">Invoice Dashboard</h1>
      <p class="text-slate-500 text-sm">Managing records with Redis-backed speed.</p>
    </header>

    <section class="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-8 shadow-xl">
      <h2 class="text-lg font-semibold mb-4 text-slate-100">Add New Invoice</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input bind:value={clientName} placeholder="Client Name" class="bg-slate-800 border-none rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none" />
        <input type="number" bind:value={amount} placeholder="Amount" class="bg-slate-800 border-none rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none" />
        <button on:click={addInvoice} class="bg-blue-600 hover:bg-blue-500 transition-colors font-bold rounded-lg py-3">Create</button>
      </div>
    </section>

    <section>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">Recent Invoices</h2>
        <button on:click={fetchInvoices} class="text-xs text-blue-400 hover:underline">Refresh</button>
      </div>

      {#if loading}
        <p class="text-slate-500 animate-pulse text-center py-10">Syncing with database...</p>
      {:else}
        <div class="space-y-3">
          {#each invoices as invoice}
            <div class="bg-slate-900 p-4 rounded-lg border border-slate-800 flex justify-between items-center hover:border-slate-700 transition-all">
              <div>
                <p class="font-medium text-white">{invoice.clientName}</p>
                <p class="text-xs text-slate-500">{new Date(invoice.date).toLocaleDateString()}</p>
              </div>
              <span class="text-xl font-mono text-green-400">${invoice.amount}</span>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</main>
