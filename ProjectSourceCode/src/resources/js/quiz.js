function revealNext(id) {
	nextId = id+1;
	const element = document.getElementById(`slider-${id}`);
	element.setAttribute("hidden", "");
	const nextElement = document.getElementById(`slider-${nextId}`);
	nextElement.removeAttribute("hidden");
}


function revealPrevious(id) {
	prevId = id-1;
	const element = document.getElementById(`slider-${id}`);
	element.setAttribute("hidden","");
	const prevElement = document.getElementById(`slider-${prevId}`);
	prevElement.removeAttribute("hidden");
}
