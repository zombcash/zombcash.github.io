(() => {
  "use strict";
  const MINT = "6cCBF9gtyp3c6VmyxUWzETk3yFmxhjvPm15cxicfpump";
  const API = "https://api.dexscreener.com/token-pairs/v1/solana/" + MINT;
  const $ = id => document.getElementById(id);
  const fmt = (value, digits=2) => Number.isFinite(Number(value)) ? new Intl.NumberFormat("ru-RU",{maximumFractionDigits:digits}).format(Number(value)) : "Нет данных";
  const money = value => Number.isFinite(Number(value)) ? (Number(value) >= 1 ? "$"+fmt(value,2) : "$"+Number(value).toPrecision(4)) : "Нет данных";
  const pct = value => Number.isFinite(Number(value)) ? (Number(value)>0?"+":"")+fmt(value,2)+"%" : "Нет данных";
  const set = (id,value) => { const node=$(id); if(node) node.textContent=value; };
  const safePair = value => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value || "");
  let busy=false;
  async function refresh(){
    if(busy)return; busy=true; set("md-status","Получаем данные DexScreener…");
    try {
      const response=await fetch(API,{headers:{accept:"application/json"},cache:"no-store"});
      if(!response.ok) throw new Error("HTTP "+response.status);
      const rows=await response.json();
      const pairs=(Array.isArray(rows)?rows:[]).filter(p=>p && p.chainId==="solana" && p.baseToken && p.quoteToken);
      if(!pairs.length) throw new Error("Источник пока не вернул торговые пулы");
      pairs.sort((a,b)=>(Number(b.liquidity?.usd)||0)-(Number(a.liquidity?.usd)||0));
      const p=pairs[0], t=p.txns||{}, v=p.volume||{}, c=p.priceChange||{};
      const h1=t.h1||{}, m5=t.m5||{}, h24=t.h24||{};
      set("md-price",money(p.priceUsd));
      set("md-change","Изменение 24 ч: "+pct(c.h24));
      set("md-mcap",p.marketCap==null?"Нет данных":money(p.marketCap));
      set("md-fdv",p.fdv==null?"Нет данных":money(p.fdv));
      set("md-liquidity",money(p.liquidity?.usd));
      set("md-pool-count","Пулов найдено: "+pairs.length);
      set("md-volume",money(v.h24));
      set("md-buys-sells","Покупки / продажи: "+fmt(h24.buys,0)+" / "+fmt(h24.sells,0));
      set("md-txns",fmt((Number(h24.buys)||0)+(Number(h24.sells)||0),0));
      set("md-hour",fmt((Number(h1.buys)||0)+(Number(h1.sells)||0),0)+" сделок");
      set("md-hour-change","Изменение цены: "+pct(c.h1));
      set("md-five",fmt((Number(m5.buys)||0)+(Number(m5.sells)||0),0)+" сделок");
      set("md-five-change","Изменение цены: "+pct(c.m5));
      const tbody=$("md-pools"); tbody.replaceChildren();
      pairs.slice(0,8).forEach(pair=>{
        const tr=document.createElement("tr");
        const cells=[(pair.dexId||"DEX")+" · "+String(pair.pairAddress||"").slice(0,6)+"…"+String(pair.pairAddress||"").slice(-5),money(pair.priceUsd),money(pair.liquidity?.usd),money(pair.volume?.h24),fmt(pair.txns?.h24?.buys,0)+" / "+fmt(pair.txns?.h24?.sells,0)];
        cells.forEach((value,index)=>{const td=document.createElement("td");td.textContent=value;if(index===0 && pair.url){const a=document.createElement("a");a.href=pair.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=value;td.replaceChildren(a);}tr.appendChild(td);});
        tbody.appendChild(tr);
      });
      if(safePair(p.pairAddress)){
        const chart=$("md-chart"); chart.src="https://dexscreener.com/solana/"+p.pairAddress+"?embed=1&theme=dark&trades=0&info=0";
        $("md-chart-wrap").hidden=false;
      }
      set("md-status","Источник доступен · Solana");
      set("md-updated","Обновлено: "+new Date().toLocaleTimeString("ru-RU"));
    } catch(error){
      set("md-status","Нет соединения с источником: "+(error?.message||"ошибка загрузки"));
      if($("md-pools") && $("md-pools").children.length===0){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=5;td.textContent="Рыночные данные временно недоступны. Попробуйте обновить страницу.";tr.appendChild(td);$("md-pools").appendChild(tr);}
    } finally {busy=false;}
  }
  const button=$("md-refresh"); if(button)button.addEventListener("click",refresh);
  refresh(); window.setInterval(refresh,60000);
})();