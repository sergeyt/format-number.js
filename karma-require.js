// simple require for tests running in browser by karma-runner
window.require = function(name){

	var mods = [
		[/format-number/, window.formatNumber],
		[/should/, window.should]
	];

	var mod = mods.filter(function(m){
		return m[0].test(name);
	});

	return mod.length ? mod[0][1] : null;
};
