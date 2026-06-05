<!-- src/components/AddInvoiceForm.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  let title = '';
  let amount = 0;
  let date = '';

  async function handleSubmit() {
    await fetch('http://localhost:4000/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, amount, date }),
    });
    // Notify parent to refresh list, or simply reload list.
    dispatch('added');
    title = ''; amount = 0; date = '';
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input bind:value={title} placeholder="Title" required />
  <input type="number" bind:value={amount} placeholder="Amount" required />
  <input type="date" bind:value={date} required />
  <button type="submit">Add Invoice</button>
</form>
