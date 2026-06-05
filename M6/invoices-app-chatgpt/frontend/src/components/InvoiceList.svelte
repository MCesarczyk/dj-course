<!-- src/components/InvoiceList.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  let invoices: { title: string; amount: number; date: string }[] = [];

  onMount(async () => {
    const res = await fetch('http://localhost:4000/invoices');
    invoices = await res.json();
  });
</script>

<h2>Invoices</h2>
<ul>
  {#each invoices as inv}
    <li>
      <strong>{inv.title}</strong>: ${inv.amount} on {new Date(inv.date).toLocaleDateString()}
    </li>
  {/each}
  {:else}
    <li>No invoices yet.</li>
  {/each}
</ul>
