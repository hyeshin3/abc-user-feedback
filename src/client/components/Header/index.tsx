/* */
import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'

/* */
import styles from './styles.module.scss'
import { Avatar, DropDown, LoginModal, Divider } from '~/components'
import { useApp, useUser } from '~/hooks'
import { Permission } from '@/types'

const Header = () => {
  const [showModal, setShowModal] = useState<boolean>(false)
  const { user, hasPermission, requestLogout } = useUser()
  const { service } = useApp()

  const { t } = useTranslation()

  const handleClickLogin = () => {
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const renderAvatar = useMemo(() => {
    if (user) {
      return (
        <Avatar
          src={user?.profile?.avatarUrl}
          name={user?.profile?.nickname || user?.email}
        />
      )
    }
    return null
  }, [user])

  const renderDropdownMenu = useMemo(() => {
    const menu = []

    if (
      hasPermission(Permission.READ_FEEDBACKS) ||
      hasPermission(Permission.MANAGE_TENANT)
    ) {
      menu.push(
        <Link href='/admin'>
          <a className={styles.dropdown__list}>{t('menu.administration')}</a>
        </Link>,
        <Divider margin={0.5} />
      )
    } else if (hasPermission(Permission.READ_USERS)) {
      menu.push(
        <Link href='/admin/user'>
          <a className={styles.dropdown__list}>{t('menu.member')}</a>
        </Link>,
        <Divider margin={0.5} />
      )
    }

    menu.push(
      <Link href='/settings/profile'>
        <a className={styles.dropdown__list}>{t('menu.account')}</a>
      </Link>,
      <div className={styles.dropdown__list} onClick={requestLogout}>
        {t('menu.logout')}
      </div>
    )

    return menu
  }, [user])

  return (
    <div className={styles.header} id='u-header'>
      <div className={styles.inner}>
        <div className={styles.container}>
          <div className={styles.item}>
            <a className={styles.logo} href='/'>
              {service?.logoUrl && (
                <img
                  src={service.logoUrl}
                  className={styles.logo__icon}
                  alt='Logo'
                />
              )}
              <span className={styles.logo__text}>{service?.name}</span>
            </a>
            {!user ? (
              <a className={styles.auth} onClick={handleClickLogin}>
                Login
              </a>
            ) : (
              <DropDown overlay={renderAvatar} className={styles.dropdown}>
                {renderDropdownMenu}
              </DropDown>
            )}
          </div>
        </div>
      </div>
      <LoginModal isOpen={showModal} onClose={handleCloseModal} />
    </div>
  )
}

export default Header
