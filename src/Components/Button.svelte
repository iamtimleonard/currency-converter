<script>
  export let notNumber;
</script>

<style>
  button {
    width: 50%;
    margin: 0;
  }
</style>

<button disabled={notNumber} on:click|preventDefault><slot /></button>
