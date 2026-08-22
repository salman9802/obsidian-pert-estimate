
function updateTimeEstimates(content) {
	const lines = content.split('\n');
	const stack = [];

	function convertToMinutes(time, unit) {
		if (!unit) return time;
		switch (unit) {
			case 'D': return time * 60 * 24 * 365 * 10; // Assuming a decade as 10 years
			case 'Y': return time * 525600;
			case 'M': return time * 43200; // Assuming an average month of 30 days
			case 'w': return time * 10080;
			case 'd': return time * 1440;
			case 'h': return time * 60;
			case 'bd': return time * 480; // Business day: 8 hours
			case 'bw': return time * 2400; // Business week: 5 days
			case 'm': return time;
			default: return time;
		}
	}

	function convertFromMinutes(timeInMinutes, unit) {
		if (!unit) return `${timeInMinutes}`; // Use the raw number for minutes
		let time = timeInMinutes;

		switch (unit) {
			case 'D':
				const days = time / (60 * 24 * 365 * 10); // Assuming a decade as 10 years
				return (days).toFixed(2).endsWith('.00') ? `${days.toFixed(0)}D` : `${(days).toFixed(2)}D`;
			case 'Y':
				const years = time / 525600;
				return (years).toFixed(2).endsWith('.00') ? `${years.toFixed(0)}Y` : `${(years).toFixed(2)}Y`;
			case 'M':
				const months = time / 43200; // Assuming an average month of 30 days
				return (months).toFixed(2).endsWith('.00') ? `${months.toFixed(0)}M` : `${(months).toFixed(2)}M`;
			case 'w':
				const weeks = time / 10080;
				return (weeks).toFixed(2).endsWith('.00') ? `${weeks.toFixed(0)}w` : `${(weeks).toFixed(2)}w`;
			case 'd':
				const daysInt = time / 1440;
				return (daysInt).toFixed(2).endsWith('.00') ? `${daysInt.toFixed(0)}d` : `${(daysInt).toFixed(2)}d`;
			case 'h':
				const hours = time / 60;
				return (hours).toFixed(2).endsWith('.00') ? `${hours.toFixed(0)}h` : `${(hours).toFixed(2)}h`;
			case 'bd':
				const businessDays = time / 480; // Business day: 8 hours
				return (businessDays).toFixed(2).endsWith('.00') ? `${businessDays.toFixed(0)}bd` : `${(businessDays).toFixed(2)}bd`;
			case 'bw':
				const businessWeeks = time / 2400; // Business week: 5 days
				return (businessWeeks).toFixed(2).endsWith('.00') ? `${businessWeeks.toFixed(0)}bw` : `${(businessWeeks).toFixed(2)}bw`;
			case 'm':
				return `${time}m`; // Minutes are always returned as raw number
			default:
				return `${time}`; // Unknown unit is handled as raw number
		}
	}

	for (let i = lines.length - 1; i >= 0; i--) {
		const line = lines[i];
		/*
			[
				"- [ ] [12m]",
				"",
				"[12m]",
				"12",
				"m"
			]
		 */
		const matchPrev = line.match(/^(\s*)- \[.\] (\[\]|\[([\d\.]+)(\w*)\])/);

		/*
			[
				"- [ ] [1m|10m|15m]",
				"",
				"[1m|10m|15m]",
				"1",
				"m",
				"10",
				"m",
				"15",
				"m"
			]
		 */
		const match = line.match(/^(\s*)- \[.\] (\[([\d\.]+)(\w*)\|([\d\.]+)(\w*)\|([\d\.]+)(\w*)\])/);

		if (match) {
			const indent = match[1].length;
			let currentTimeInMinutes = 0;
			let unit; // Default to undefined for no unit

			// Skip any improperly formed tasks estimates
			if (!match[2].startsWith("[") || !match[2].endsWith("]")) continue;

			// Skip invalid values
			if (!match[3] || !match[5] || !match[7]) continue;

			let optmisticInMin = convertToMinutes(parseFloat(match[3], match[4]));
			let mostLikelyInMin = convertToMinutes(parseFloat(match[5], match[6]));
			let pessimisticInMin = convertToMinutes(parseFloat(match[7], match[8]));

			// ========== Calculate PERT estimate ==========
			currentTimeInMinutes = (optmisticInMin + (4 * mostLikelyInMin) + pessimisticInMin) / 6;
			unit = "m";

			// Parse current time estimate if present
			// if (match[2].startsWith('[') && match[3]) {
			// 	currentTimeInMinutes = convertToMinutes(parseFloat(match[3]), match[4]);
			// 	unit = match[4];
			// }

			// Recompute time by summing subtasks
			let totalTimeInMinutes = 0;
			while (stack.length > 0 && stack[stack.length - 1].level > indent) {
				const subtask = stack.pop();
				totalTimeInMinutes += subtask.time;

				// Determine the coarsest unit to use for the sum
				if (subtask.unit === 'D' || unit === 'D') {
					unit = 'D';
				} else if (subtask.unit === 'Y' || unit === 'Y') {
					unit = 'Y';
				} else if (subtask.unit === 'M' || unit === 'M') {
					unit = 'M';
				} else if (subtask.unit === 'w' || unit === 'w') {
					unit = 'w';
				} else if (subtask.unit === 'd' || unit === 'd') {
					unit = 'd';
				} else if (subtask.unit === 'h' || unit === 'h') {
					unit = 'h';
				} else if (subtask.unit === 'bw' || unit === 'bw') {
					unit = 'bw';
				} else if (subtask.unit === 'bd' || unit === 'bd') {
					unit = 'bd';
				}
			}

			// If no subtasks contribute, use the current task's own estimate
			totalTimeInMinutes = totalTimeInMinutes > 0 ? totalTimeInMinutes : currentTimeInMinutes;

			// Update line with the new total time and unit
			if (match[2] === '[]') {
				lines[i] = line.replace(/\[\]/, `[${convertFromMinutes(totalTimeInMinutes, unit)}]`);
			} else {
				// lines[i] = line.replace(/\[([\d\.]+)(\w*)\]/, `[${convertFromMinutes(totalTimeInMinutes, unit)}] {${match[2]}}`);
				lines[i] = line.replace(/\[([\d\.]+)(\w*)\|([\d\.]+)(\w*)\|([\d\.]+)(\w*)\]/, `[${convertFromMinutes(totalTimeInMinutes, unit)}] {${match[2]}}`);

			}

			// Push the updated total time for this task onto the stack
			stack.push({ level: indent, time: totalTimeInMinutes, unit });
		}
	}

	return lines.join('\n');
}

console.log(updateTimeEstimates(""))

