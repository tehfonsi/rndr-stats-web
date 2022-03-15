import fetch from 'node-fetch';

const API_KEY = process.env.POLYGONSCAN_API_KEY;
const RNDR_CONTRACT = '0x61299774020dA444Af134c82fa83E3810b309991';
const WALLET_ADDRESS = '0xF34913F977a2f4630339a76955Baa859614f6dDb';


export const getLatestTransactions = async (page = 1, offset = 100) => {
  const url = `https://api.polygonscan.com/api?module=account&action=tokentx&contractaddress=${RNDR_CONTRACT}&address=${WALLET_ADDRESS}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc&apikey=${API_KEY}`

  const respone = await fetch(url);
  const json = await respone.json();

  return json;
};


// https://api.polygonscan.com/api?module=account&action=tokentx&contractaddress=0x61299774020dA444Af134c82fa83E3810b309991&address=0xf675F37AA8Db2d0424EB173BF5F10a33FCB27270&startblock=0&endblock=99999999&page=1&offset=5&sort=desc&apikey=QVEXTNIC83P8CAMVAT9CQ4TMZ58JBK9BPT
// https://api.polygonscan.com/api?module=account&action=tokentx&contractaddress=0x61299774020dA444Af134c82fa83E3810b309991&address=0xF34913F977a2f4630339a76955Baa859614f6dDb&startblock=0&endblock=99999999&page=1&offset=5&sort=desc&apikey=QVEXTNIC83P8CAMVAT9CQ4TMZ58JBK9BPT
// 0xF34913F977a2f4630339a76955Baa859614f6dDb
// 0xf675F37AA8Db2d0424EB173BF5F10a33FCB27270

// 3423234234, 48 rndr, 10.02.2022

// package
// id , operator, transaction id, name, valid until
// 1, 2923923, 3423234234, 'supporter', 10.02.2022

//date("Y-m-d H:i:s", "2022-02-10 22:11:00")