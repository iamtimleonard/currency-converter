<script>
  import { createEventDispatcher } from "svelte";

  import NumberInput from "./NumberInput.svelte";
  import CurrencySelector from "./CurrencySelector.svelte";
  import Error from "./Error.svelte";
  import Button from "./Button.svelte";

  export let fromValue;
  export let toValue;
  export let fromCurrency;
  export let toCurrency;
  export let notNumber;

  let dispatch = createEventDispatcher();
</script>

<style>
  section {
    width: 100%;
    margin: 10rem 0;
  }
  .form-control {
    margin: 0 auto;
    text-align: center;
    border: 1px solid black;
    max-width: 500px;
    padding: 3rem;
  }

  .pair {
    display: flex;
  }

  form {
    display: flex;
    flex-direction: column;
  }
</style>

<section>
  <div class="form-control">
    <form on:submit={() => dispatch('convert')}>
      <div class="pair">
        <NumberInput
          on:input={() => dispatch('reset-value')}
          isReadOnly={false}
          bind:value={fromValue} />
        <CurrencySelector
          on:change={() => dispatch('change')}
          bind:value={fromCurrency} />
      </div>
      {#if notNumber}
        <Error />
      {/if}
      <div class="pair">
        <NumberInput isReadOnly={true} bind:value={toValue} />
        <CurrencySelector bind:value={toCurrency} />
      </div>
      <div class="pair">
        <Button {notNumber} on:click={() => dispatch('convert')}>
          CONVERT
        </Button>
        <Button {notNumber} on:click={() => dispatch('swap')}>SWAP</Button>
      </div>
    </form>
  </div>
</section>
