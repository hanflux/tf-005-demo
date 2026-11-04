// Hand-authored SVG geometry: no external images, fonts or competitor assets.
const shapes={
t1:'<rect x="5" y="18" width="32" height="15" rx="4" fill="#e39348"/><path d="M11 18v-8h14v8M31 18v-5"/><circle cx="12" cy="35" r="4"/><circle cx="31" cy="35" r="4"/>',
t2:'<rect x="4" y="23" width="20" height="16" fill="#e6b442"/><rect x="22" y="9" width="18" height="30" fill="#e88265"/><path d="M8 22v-4h5v4m14-14V4h6v4"/>',
t3:'<path d="M8 21l14-9 14 9-14 18Z" fill="#9b91c4"/><path d="M22 4v9m-14 8h28M22 39v5"/>',
t4:'<path d="M22 22v21"/><path d="M22 22L7 5v17Zm0 0L39 7H22Zm0 0l16 16V22Zm0 0L6 38h16Z" fill="#e8a45a"/><circle cx="22" cy="22" r="3"/>',
t5:'<path d="M4 24h5l7-12h14l7 12h4v12H4Z" fill="#79b4b3"/><path d="M17 14v10h14l-4-10Z" fill="#fff5df"/><circle cx="12" cy="36" r="5"/><circle cx="33" cy="36" r="5"/>',
d1:'<path d="M10 8h23v30H10Z" fill="#73afb9"/><path d="M33 14h7v16h-7M14 13v18"/>',
d2:'<circle cx="22" cy="24" r="15" fill="#e2b35a"/><path d="M22 13v12l8 4M8 7l6-3m16 0 6 3M12 38l-4 5m24-5 4 5"/>',
d3:'<path d="M10 39V16q0-7 5-5V5q4-6 6 0V3q5-3 6 3v7q5-5 7 1l-1 11q-2 8-6 14Z" fill="#d99487"/>',
d4:'<path d="M4 23a18 18 0 0136 0q-6-5-12 0-6-5-12 0-6-5-12 0Z" fill="#809ec7"/><path d="M22 23v16q0 8 8 2M22 2v3"/>',
d5:'<rect x="7" y="6" width="30" height="35" rx="4" fill="#86b7a8"/><path d="M12 12h20M12 34h20m-20 4h20"/>',
c1:'<path d="M5 10v28q17 10 34 0V10" fill="#ddad77"/><ellipse cx="22" cy="10" rx="17" ry="6" fill="#e8d9be"/><ellipse cx="22" cy="10" rx="6" ry="2" fill="none"/><path d="M12 30V18l7 5h7l7-5v12q-10 13-21 0Z" fill="#fff6e3"/><path d="M17 28h1m9 0h1m-6 3v3m-11-3 6 1m10 0 7-1"/>',
c2:'<path d="M5 43L25 12" stroke="#bb7551" stroke-width="4"/><path d="M25 12q15-16 14 2l-2 5" fill="none"/><path d="M37 19Q19 12 23 31q8 4 14-12Z" fill="#df8c75"/><path d="M37 19q13 7 3 18-10-4-3-18Z" fill="#92b6b0"/><path d="M37 19q-15 17-5 23 12-9 5-23Z" fill="#c2a1d0"/>',
c3:'<path d="M3 13l29-8 10 31-29 9Z" fill="#d1a06b"/><path d="M8 16l21-6 8 23-21 6Z" fill="#e4c393"/><path d="M12 18l20-5m-18 10 20-5m-18 10 20-5m-18 10 20-5" stroke="#b28658"/><path d="M19 14l2 13m4-15 2 13m4-9 1 9" stroke="#765745" stroke-width="2.5"/>',
c4:'<path d="M10 20h25l7 18H3Z" fill="#b397ca"/><ellipse cx="22" cy="20" rx="12" ry="4" fill="#f8ebd3"/><path d="M17 29l5-4 5 4"/>',
c5:'<circle cx="22" cy="22" r="16" fill="#d4a2b2"/><path d="M10 11q23 0 25 19M7 22q16-14 29-8M11 34q7-23 21-24M22 38q0-14 17-18m-3 12q10 10 5 13"/>',
r1:'<path d="M4 14l18-9 18 9v24L22 44 4 35Z" fill="#c6a16b"/><path d="M4 14l18 9 18-9M22 23v21m-8-35 18 9"/>',
r2:'<path d="M16 4h12v8l6 9v19H10V21l6-9Z" fill="#97c1ac"/><path d="M10 25h24v9H10M16 8h12"/>',
r3:'<path d="M8 15h28l4 26H4Z" fill="#c2a16b"/><path d="M15 15V8q8-12 14 0v7M12 31h20"/>',
r4:'<path d="M6 7h29v33H6Z" fill="#ddd4b7"/><path d="M11 13h19M11 18h8v9h-8Zm13 0h6m-6 5h6m-19 9h19m-19 4h19"/>',
r5:'<rect x="11" y="6" width="24" height="36" rx="6" fill="#a0b57c"/><path d="M12 12h22M12 35h22m-11-18h7m-7 5h7"/>'
};
export function art(id){return `<svg viewBox="0 0 46 48" aria-hidden="true"><g stroke="#5c554a" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" fill="#625b51">${shapes[id]}</g></svg>`;}
