// ==UserScript==
// @name         Archive mangalib.me
// @namespace    https://github.com/JumpJets/Archive-mangalib-userscript
// @version      1.2
// @description  Download manga from mangalib.me and hentailib.me as archived zip.
// @author       X4
// @include      /^https?:\/\/(?:manga|hentai)lib\.me\/[\w\-]+(?:\?.+|#.*)?$/
// @icon         https://icons.duckduckgo.com/ip2/mangalib.me.ico
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.9.1/jszip.min.js
// @grant        none
// ==/UserScript==

(function() {
	"use strict";

	const dl_archive = async (e) => {
		const ftch = async (url) => { const resp = await fetch(url, {method: "GET"}); return await resp.text() };
		const ftchi = async (url) => { const resp = await fetch(url, {method: "GET"}); return await resp.blob() };

		const html_template = (title, chapters, imgs, manga_type) => `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>${title}</title>
	<style>
		body {
			font-weight: 100;
			font-family: -webkit-pictograph;
			font-size: 18px;
			line-height: 1;
			text-align: center;
			word-break: break-word;
			margin: 0 auto;
			padding: 0 10px;
			background-color: #434751;
			color: #dbdbdb;
			min-height: 100vh;
		}

		* {
			tab-size: 4 !important;
			scrollbar-width: thin; /* Firefox scrollbar 8px */
		}
		/* Chrome scrollbar */
		*::-webkit-scrollbar {
			width: 8px;
			height: 8px;
			background-color: transparent;
		}
		*::-webkit-scrollbar-thumb {
			background-color: #8888;
		}
		*::-webkit-scrollbar:hover {
			background-color: #8883;
		}

		.wrap {
			line-height: 1.4;
			font-weight: 700;
			font-size: 24px;
			display: grid;
			justify-items: center;
			align-content: start;
		}
		.wrap.manga {
			gap: 5vh;
		}

		img {
			display: block;
			max-width: 100%;
		}

		a {
			display: block;
			user-select: none;
			color: inherit;
			text-decoration: none;
			border-radius: 10px;
		}
		a:hover {
			background-color: #dbdbdb30;
		}

		.prev, .next {
			position: fixed;
			bottom: 5px;
			width: 4vw;
			height: 30vh;
			font-size: 2vw;
			line-height: 30vh;
			border: 1px solid #dbdbdb;
			cursor: pointer;
			user-select: none;
			border-radius: 10px;
			z-index: 5;
		}
		.prev {
			left: 5px;
		}
		.next {
			right: 5px;
		}

		nav {
			position: fixed;
			right: 0;
			/* top: 0; */
			bottom: 0;
			max-width: 520px;
			min-width: 300px;
			display: grid;
			padding: 10px 14px;
			gap: 2px;
			align-content: start;
			background-color: hsla(223, 9.5%, 22%, 0);
			text-align: left;
			font-weight: 500;
			font-size: 16px;
			max-height: 40px;
			overflow: hidden;
			user-select: none;
			z-index: 3;
			transition: .3s ease;
		}
		nav::before {
			content: "Оглавление";
			display: block;
			font-size: 20px;
			padding: 15px 15px 20px 15px;
			cursor: pointer;
		}
		nav:focus-within {
			max-height: calc(100vh - 20px);
			overflow: auto;
			background-color: hsla(223, 9.5%, 22%, 1);
			z-index: 6;
		}
		nav > div {
			padding: 10px 14px;
			cursor: pointer;
			border-radius: 10px;
		}
		nav > div:not(.branches):hover, nav > div.current {
			background-color: hsla(223, 9.5%, 13%, 0.3);
		}
		nav > div:not(.branches).hidden {
			display: none;
		}
		nav > .branches {
			display: grid;
			grid-auto-flow: dense;
			grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
			gap:20px;
			justify-content: space-around;
			text-align: center;
		}
		nav > .branches > .branch {
			padding: 10px;
			background-color: #252527;
			font-size: 18px;
			font-weight: 300;
			border-radius: 20px;
		}
		nav > div.branches > .branch:hover {
			background-color: hsla(223, 9.5%, 53%, 0.3);
		}
	</style>
</head>
<body>
	<div class="wrap"></div>

<script>
	const _chapters = ${JSON.stringify(chapters)},
		  _imgs = ${JSON.stringify(imgs)},
		  collator = new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}),
		  chapters = _chapters.sort((a, b) => collator.compare(\`team\${a.branch_id ?? ""}/v\${a.chapter_volume}_\${a.chapter_number}\`, \`team\${b.branch_id ?? ""}/v\${b.chapter_volume}_\${b.chapter_number}\`)),
		  imgs = _imgs.sort((a, b) => collator.compare(a[0], b[0])),
		  manga_type = ${manga_type},
		  wrap = document.querySelector(".wrap"),
		  nav = document.createElement("nav"),
		  a_p = document.createElement("div"),
		  a_n = document.createElement("div"),
		  branches = !!chapters[0].branch_id ? [...new Set(chapters.map(c => c.branch_id))] : null;
	var current = 0,
		branch = branches?.[0];

	const load_chapter = (idx) => {
		const ch_imgs = imgs[idx];

		for (let iurl of ch_imgs) {
			const img = new Image();
			img.src = iurl;
			wrap.appendChild(img);
		}
	}

	const switch_chapter = (idx) => {
		if (idx === null || idx === current || idx < 0 || idx >= imgs.length) return;
		if (branches && (chapters[idx].branch_id != branch)) return;

		window.scrollTo({top: 0, behavior: "instant"});

		while (wrap.lastChild) wrap.lastChild.remove();

		load_chapter(idx);
		current = idx;
		nav.querySelector(".current")?.classList?.remove?.("current");
		nav.children[idx + !!branches]?.classList?.add?.("current");
	}

	if (manga_type === 1) {
		wrap.classList.add("manga");
		wrap.addEventListener("click", (e) => { if (e.target.tagName !== "IMG") return; e.target.nextSibling.scrollIntoView({block: "start", behavior: "smooth"}) });
	} else {
		wrap.addEventListener("click", (e) => { if (e.target.tagName !== "IMG") return; window.scrollBy({top: window.innerHeight, behavior : "smooth"}) })
	}

	a_p.classList.add("prev");
	a_n.classList.add("next");

	a_p.innerText = "←";
	a_n.innerText = "→";

	a_p.addEventListener("click", (e) => switch_chapter(current - 1));
	a_n.addEventListener("click", (e) => switch_chapter(current + 1));
	document.addEventListener("keyup", (e) => {
		if (e.keyCode === 37) switch_chapter(current - 1)
		else if (e.keyCode === 39) switch_chapter(current + 1)
	});

	document.body.appendChild(a_p);
	document.body.appendChild(a_n);

	if (branches) {
		const bw = document.createElement("div");

		bw.classList.add("branches");

		for (let b of branches) {
			const bd = document.createElement("div");

			bd.dataset.branch_id = b;
			bd.innerText = \`Team \${b}\`;
			bd.classList.add("branch");

			bd.addEventListener("click", (e) => {
				branch = nav.dataset.branch_id = +e.currentTarget.dataset.branch_id;
				[...nav.querySelectorAll(\`nav > [data-index]:not([data-branch_id="\${branch}"])\`)].map(a => a.classList.add("hidden"));
				[...nav.querySelectorAll(\`nav > [data-index][data-branch_id="\${branch}"]\`)].map(a => a.classList.remove("hidden"));
			});

			bw.appendChild(bd);
		}

		nav.dataset.branch_id = branch;

		nav.appendChild(bw);
	}

	chapters.forEach((ch, i) => {
		const cd = document.createElement("div");
		cd.innerText = \`Том \${ch.chapter_volume} Глава \${ch.chapter_number}\` + (ch.chapter_name ? \` - \${ch.chapter_name}\` : "");
		cd.dataset.volume = ch.chapter_volume;
		cd.dataset.number = ch.chapter_number;
		if (branches) {
			cd.dataset.branch_id = ch.branch_id;
			if (ch.branch_id !== branch) cd.classList.add("hidden");
		}
		cd.dataset.index = i;

		cd.addEventListener("click", (e) => switch_chapter(+e.currentTarget.dataset.index));

		if (ch.chapter_id === chapters[current].chapter_id) cd.classList.add("current");

		nav.appendChild(cd);
	});

	nav.setAttribute("tabindex", "0");

	document.body.appendChild(nav);

	load_chapter(current);
</script>
</body>
</html>`;

		const zip = new JSZip(),
			  chapters = window?.__DATA__?.chapters?.list?.reverse?.() ?? [],
			  last = chapters[chapters.length - 1],
			  title = window?.__DATA__?.manga?.rusName ?? window?.__DATA__?.manga?.name, // document.querySelector(".media-name__main").innerText,
			  html_idata = [];
		let manga_type = null;

		for (let c of chapters) {
			console.log(`DL volume ${c.chapter_volume} chapter ${c.chapter_number} (branch ${c.branch_id}) of volume ${last.chapter_volume} chapter ${last.chapter_number}`);

			const url = `${window.location.origin}${window.location.pathname}/v${c.chapter_volume}/c${c.chapter_number}` + (c.branch_id ? `?bid=${c.branch_id}` : ""),
				  [s_data, s_pg] = await ftch(url).then((text) => { const p = new DOMParser(), doc = p.parseFromString(text, "text/html"); return [Array.from(doc.querySelectorAll("script")).filter(s => /window\.__DATA__/.test(s.innerText))[0], Array.from(doc.querySelectorAll("script")).filter(s => /window\.__pg/.test(s.innerText))[0]]; }),
				  ch_data = JSON.parse(s_data.innerText.match(/(?<=window\.__DATA__\s*=\s*){.+}/)[0]),
				  ch_info = JSON.parse(s_data.innerText.match(/(?<=window\.__info\s*=\s*){.+}/)[0]), // media type for manga 1, webtoon 5
				  ch_imgs = JSON.parse(s_pg.innerText.match(/(?<=window\.__pg\s*=\s*)\[.+\]/)[0]),
				  ch_idata = [],
				  ch_promises = [];

			if (!manga_type) manga_type = ch_info?.media?.type ?? 1;
			for (let img of ch_imgs) {
				// console.debug(`DL img ${img.p} ${img.u}`);

				const pr = new Promise((resolve, reject) => {
					const iurl = `${ch_info.servers.secondary}/${ch_info.img.url}${img.u}`,
						  b = c.branch_id ? `team${c.branch_id}` : null,
						  f = `v${c.chapter_volume}_${(+c.chapter_number).toLocaleString("en-US", {minimumIntegerDigits: 3, useGrouping: false})}`,
						  n = `${img.p.toLocaleString("en-US", {minimumIntegerDigits: 3, useGrouping: false})}.${img.u.split(".")[1]}`,
						  tmp_img = new Image();

					ch_idata.push((b ? `${b}/` : "") + `${f}/${n}`);

					tmp_img.src = iurl;
					tmp_img.onload = async (e) => {
						const iblob = await ftchi(iurl).then((blb) => blb).catch((error) => {console.log(error)});

						b ? zip.folder(b).folder(f).file(n, iblob) : zip.folder(f).file(n, iblob);

						// e?.currentTarget?.remove?.();
						resolve((b ? `${b}/` : "") + `${f}/${n}`);
					}
					tmp_img.onerror = () => reject((b ? `${b}/` : "") + `${f}/${n}`);
					// document.body.appendChild(tmp_img);
				});
				ch_promises.push(pr);
			}

			html_idata.push(ch_idata);

			const pr_results = await Promise.allSettled(ch_promises);
			console.log("DL result:", pr_results);
		}

		zip.file("index.html", html_template(title, chapters, html_idata, manga_type));

		zip.generateAsync({type: "blob"}).then((blob) => {
			const a = document.createElement("a");
			console.log("ZIP size (bytes):", blob, "MB:", ((blob?.size ?? 0) / 1024 / 1024));
			a.href = URL.createObjectURL(blob);
			a.download = `${window.location.pathname.substring(window.location.pathname.lastIndexOf("/") + 1)}.zip`;
			a.click();
		});
	}

	const btn = document.createElement("div");
	btn.style.width = "40px";
	btn.style.height = "40px";
	btn.style.cursor = "pointer";
	btn.style.position = "fixed";
	btn.style.right = "20px";
	btn.style.bottom = "20px";
	btn.style.background = "#dbdbdb30";
	btn.style.border = "1px solid #dbdbdb";
	btn.style.borderRadius = "14px";
	btn.style.userSelect = "none";
	btn.style.lineHeight = "30px";
	btn.style.fontSize = "20px";
	btn.style.textAlign = "center";
	btn.innerText = "📥";

	document.body.appendChild(btn);

	btn.addEventListener("click", async (e) => { await dl_archive(e) });
})();
