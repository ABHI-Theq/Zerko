"use client"

import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  
  const [name, setName] = useState(session?.user?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name cannot be empty")
      return
    }

    setIsUpdatingName(true)
    try {
      const response = await fetch('/api/profile/update-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update name')
      }

      await update()
      toast.success("Name updated successfully")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUpdatingName(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required")
      return
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    setIsUpdatingPassword(true)
    try {
      const response = await fetch('/api/profile/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password')
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      toast.success("Password updated successfully")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      await update()
      toast.success("Profile image updated successfully")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUploadingImage(false)
    }
  }

  if (!session) {
    router.push('/auth/sign-in')
    return null
  }

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <Link href={"/"} className="absolute top-10 left-10 cursor:pointer">
        <Image
          src={"/go-back.png"}
          alt="go Home"
          width={45}
          height={40}
        />
      </Link>
      <div className="space-y-6">
        {/* Profile Image Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative">
              <Image
                src={session.user?.image || "/user.png"}
                alt="Profile"
                width={120}
                height={120}
                className="rounded-full object-cover border-4 border-gray-200"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary/90 disabled:opacity-50"
              >
                {isUploadingImage ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Click the camera icon to upload a new image (max 5MB)
            </p>
          </CardContent>
        </Card>

        {/* Name Update Section */}
        <Card>
          <CardHeader>
            <CardTitle>Username</CardTitle>
            <CardDescription>Update your display name</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNameUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <Button type="submit" disabled={isUpdatingName}>
                {isUpdatingName ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Name'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Update Section */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button type="submit" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="text-sm font-medium">{session.user?.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
