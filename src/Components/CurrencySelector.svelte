<script>
  export let value;
</script>

<style>
  select {
    width: 25%;
    margin: 0;
  }
</style>

<select on:change bind:value>
  <option value="USD">USD</option>
  <option value="EUR">EUR</option>
  <option value="GBP">GBP</option>
  <option value="CNY">CNY</option>
</select>
