function getData() {
    setTimeout(() => {
        return 'Evet'
    }, 2000);
  }

  async function printData() {
    console.log("Before getting data");
  
    const data = await getData();
  
    console.log(`Data: ${data}`);
    console.log("After getting data");
  }
  
  printData();
  console.log("Continuing execution");