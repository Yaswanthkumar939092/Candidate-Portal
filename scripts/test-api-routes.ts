#!/usr/bin/env node

/**
 * Test script to verify all API routes are properly structured
 * Run with: npx ts-node scripts/test-api-routes.ts
 */

import fs from 'fs'
import path from 'path'

const API_BASE_PATH = path.join(process.cwd(), 'app', 'api')

interface RouteInfo {
  path: string
  file: string
  methods: string[]
  hasAuthentication: boolean
  hasValidation: boolean
}

function extractRouteInfo(filePath: string): RouteInfo {
  const content = fs.readFileSync(filePath, 'utf-8')
  const relativePath = path.relative(API_BASE_PATH, filePath)

  // Extract HTTP methods
  const methods: string[] = []
  const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/g
  let match
  while ((match = methodRegex.exec(content)) !== null) {
    methods.push(match[1])
  }

  // Check for authentication
  const hasAuthentication = content.includes('getUserFromRequest') ||
                          content.includes('withAuth') ||
                          content.includes('Authorization') ||
                          content.includes('supabase-access-token')

  // Check for validation
  const hasValidation = content.includes('schema.parse') ||
                       content.includes('z.object') ||
                       content.includes('validate')

  return {
    path: relativePath.replace(/route\.ts$/, '').replace(/\\/g, '/'),
    file: filePath,
    methods,
    hasAuthentication,
    hasValidation
  }
}

function findRouteFiles(dir: string): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) {
    console.warn(`Directory ${dir} does not exist`)
    return files
  }

  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      files.push(...findRouteFiles(fullPath))
    } else if (item === 'route.ts') {
      files.push(fullPath)
    }
  }

  return files
}

function main() {
  console.log('🔍 Analyzing API Routes...\n')

  const routeFiles = findRouteFiles(API_BASE_PATH)

  if (routeFiles.length === 0) {
    console.log('❌ No API route files found!')
    return
  }

  const routes: RouteInfo[] = []

  for (const file of routeFiles) {
    try {
      const routeInfo = extractRouteInfo(file)
      routes.push(routeInfo)
    } catch (error) {
      console.error(`❌ Error analyzing ${file}:`, error)
    }
  }

  // Sort routes by path
  routes.sort((a, b) => a.path.localeCompare(b.path))

  // Display results
  console.log('📊 API Routes Analysis Results:\n')
  console.log('Legend: 🔒 = Authentication, ✅ = Validation, 🔧 = Methods\n')

  for (const route of routes) {
    const authIcon = route.hasAuthentication ? '🔒' : '⚪'
    const validationIcon = route.hasValidation ? '✅' : '⚪'
    const methodsStr = route.methods.join(', ') || 'No methods found'

    console.log(`${authIcon} ${validationIcon} /api${route.path}`)
    console.log(`    🔧 Methods: ${methodsStr}`)
    console.log()
  }

  // Summary statistics
  console.log('📈 Summary Statistics:')
  console.log(`   Total Routes: ${routes.length}`)
  console.log(`   With Authentication: ${routes.filter(r => r.hasAuthentication).length}`)
  console.log(`   With Validation: ${routes.filter(r => r.hasValidation).length}`)
  console.log(`   GET endpoints: ${routes.filter(r => r.methods.includes('GET')).length}`)
  console.log(`   POST endpoints: ${routes.filter(r => r.methods.includes('POST')).length}`)
  console.log(`   PUT endpoints: ${routes.filter(r => r.methods.includes('PUT')).length}`)
  console.log(`   DELETE endpoints: ${routes.filter(r => r.methods.includes('DELETE')).length}`)

  // Check for expected routes
  console.log('\n🎯 Expected Routes Check:')

  const expectedRoutes = [
    '/auth/signup',
    '/auth/signin',
    '/auth/signout',
    '/auth/profile',
    '/jobs',
    '/jobs/[id]',
    '/jobs/[id]/save',
    '/jobs/saved',
    '/applications',
    '/applications/[id]',
    '/admin/dashboard',
    '/admin/users',
    '/admin/sync/jobs'
  ]

  const foundPaths = routes.map(r => r.path)

  for (const expected of expectedRoutes) {
    const found = foundPaths.some(path => path === expected || path.includes(expected.replace('[id]', '')))
    console.log(`   ${found ? '✅' : '❌'} ${expected}`)
  }

  console.log('\n🎉 Analysis Complete!')
}

if (require.main === module) {
  main()
}