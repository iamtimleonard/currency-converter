<script>
  export let value;
  export let isReadOnly;
</script>

<style>
  input {
    width: 75%;
    margin: 0;
  }
</style>

<input on:input readonly={isReadOnly} type="text" bind:value />
