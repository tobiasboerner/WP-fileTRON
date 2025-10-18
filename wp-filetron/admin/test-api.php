<?php
/**
 * API Test Page
 *
 * Simple page to test REST API endpoints with proper authentication.
 *
 * Access: WordPress Admin -> fileTRON -> API Test (will be added to menu)
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<!DOCTYPE html>
<html>
<head>
	<title>WP fileTRON - API Test</title>
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
		.test-section { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
		button { background: #2271b1; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px; }
		button:hover { background: #135e96; }
		.result { background: white; border: 1px solid #ddd; padding: 15px; margin-top: 10px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto; }
		.success { border-left: 4px solid #46b450; }
		.error { border-left: 4px solid #dc3232; }
		h2 { color: #1d2327; margin-top: 0; }
		.endpoint { color: #0073aa; font-weight: 600; }
		input, textarea { width: 100%; padding: 8px; margin: 5px 0; box-sizing: border-box; }
	</style>
</head>
<body>
	<h1>🧪 WP fileTRON API Test</h1>
	<p>Diese Seite testet die REST API Endpoints mit automatischer Authentifizierung.</p>

	<!-- Test: GET Folders -->
	<div class="test-section">
		<h2>📁 GET /folders</h2>
		<p class="endpoint">GET <?php echo rest_url( 'wft/v1/folders' ); ?></p>
		<button onclick="testGetFolders()">Alle Ordner abrufen</button>
		<div id="result-folders" class="result" style="display:none;"></div>
	</div>

	<!-- Test: CREATE Folder -->
	<div class="test-section">
		<h2>➕ POST /folders</h2>
		<p class="endpoint">POST <?php echo rest_url( 'wft/v1/folders' ); ?></p>
		<input type="text" id="folder-name" placeholder="Ordner Name" value="Test Ordner">
		<input type="color" id="folder-color" value="#FF5733">
		<button onclick="testCreateFolder()">Ordner erstellen</button>
		<div id="result-create" class="result" style="display:none;"></div>
	</div>

	<!-- Test: GET Tags -->
	<div class="test-section">
		<h2>🏷️ GET /tags</h2>
		<p class="endpoint">GET <?php echo rest_url( 'wft/v1/tags' ); ?></p>
		<button onclick="testGetTags()">Alle Tags abrufen</button>
		<div id="result-tags" class="result" style="display:none;"></div>
	</div>

	<!-- Test: CREATE Tag -->
	<div class="test-section">
		<h2>➕ POST /tags</h2>
		<p class="endpoint">POST <?php echo rest_url( 'wft/v1/tags' ); ?></p>
		<input type="text" id="tag-name" placeholder="Tag Name" value="Wichtig">
		<input type="text" id="tag-desc" placeholder="Beschreibung" value="Wichtige Dateien">
		<button onclick="testCreateTag()">Tag erstellen</button>
		<div id="result-create-tag" class="result" style="display:none;"></div>
	</div>

	<script>
		const apiUrl = '<?php echo rest_url( 'wft/v1/' ); ?>';
		const nonce = '<?php echo wp_create_nonce( 'wp_rest' ); ?>';

		function showResult(elementId, data, isError = false) {
			const el = document.getElementById(elementId);
			el.style.display = 'block';
			el.className = 'result ' + (isError ? 'error' : 'success');
			el.textContent = JSON.stringify(data, null, 2);
		}

		async function testGetFolders() {
			try {
				const response = await fetch(apiUrl + 'folders', {
					method: 'GET',
					headers: {
						'X-WP-Nonce': nonce
					},
					credentials: 'include'
				});
				const data = await response.json();
				showResult('result-folders', data, !response.ok);
			} catch (error) {
				showResult('result-folders', { error: error.message }, true);
			}
		}

		async function testCreateFolder() {
			const name = document.getElementById('folder-name').value;
			const color = document.getElementById('folder-color').value;

			try {
				const response = await fetch(apiUrl + 'folders', {
					method: 'POST',
					headers: {
						'X-WP-Nonce': nonce,
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: JSON.stringify({
						name: name,
						color: color,
						parent_id: 0
					})
				});
				const data = await response.json();
				showResult('result-create', data, !response.ok);
			} catch (error) {
				showResult('result-create', { error: error.message }, true);
			}
		}

		async function testGetTags() {
			try {
				const response = await fetch(apiUrl + 'tags', {
					method: 'GET',
					headers: {
						'X-WP-Nonce': nonce
					},
					credentials: 'include'
				});
				const data = await response.json();
				showResult('result-tags', data, !response.ok);
			} catch (error) {
				showResult('result-tags', { error: error.message }, true);
			}
		}

		async function testCreateTag() {
			const name = document.getElementById('tag-name').value;
			const desc = document.getElementById('tag-desc').value;

			try {
				const response = await fetch(apiUrl + 'tags', {
					method: 'POST',
					headers: {
						'X-WP-Nonce': nonce,
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: JSON.stringify({
						name: name,
						description: desc
					})
				});
				const data = await response.json();
				showResult('result-create-tag', data, !response.ok);
			} catch (error) {
				showResult('result-create-tag', { error: error.message }, true);
			}
		}

		console.log('🧪 API Test bereit!');
		console.log('API URL:', apiUrl);
		console.log('Nonce:', nonce);
	</script>
</body>
</html>
