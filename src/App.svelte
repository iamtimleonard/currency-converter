<script>
	import Header from "./Components/Header.svelte";
	import InputArea from "./Components/InputArea.svelte";

	const apiKey = __myapp.env.API_CLIENT_KEY;

	let fromValue = "";
	let toValue = "";
	let fromCurrency = "USD";
	let toCurrency = "EUR";
	$: notNumber = showError(fromValue);

	const showError = () => {
		return isNaN(fromValue);
	};

	const convert = () => {
		const key = `${fromCurrency}_${toCurrency}`;
		const url = `https://free.currconv.com/api/v7/convert?q=${fromCurrency}_${toCurrency}&compact=ultra&apiKey=${apiKey}`;
		fetch(url)
			.then((res) => res.json())
			.then((data) => (toValue = (fromValue * data[key]).toFixed(2)));
	};

	const swapCurrencies = () => {
		let placeholder = toCurrency;
		toCurrency = fromCurrency;
		fromCurrency = placeholder;
		convert();
	};

	const change = () => {
		fromValue = "";
		toValue = "";
	};

	const resetValue = () => {
		toValue = "";
	};
</script>

<style>
</style>

<Header />
<InputArea
	bind:fromValue
	bind:toValue
	bind:fromCurrency
	bind:toCurrency
	{notNumber}
	on:swap={swapCurrencies}
	on:convert={convert}
	on:change={change}
	on:reset-value={resetValue} />
